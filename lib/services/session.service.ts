import { db } from '@/lib/db/client'
import { sessions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { computeBill } from './billing.service'
import { logger } from '@/lib/config/logger'
import type { Rate } from '@/lib/db/schema'

export async function createSession(childId: string, rateId: string, staffId: string, rate: Rate) {
  const id = uuidv4()
  const qrCode = uuidv4()
  const now = new Date()

  const [session] = await db.insert(sessions).values({
    id,
    childId,
    rateId,
    staffId,
    status: 'ACTIVE',
    timeIn: now,
    qrCode,
    rateSnapshot: { label: rate.label, pricePerHour: rate.pricePerHour },
  }).returning()

  logger.info({ sessionId: id, childId, staffId }, 'session.created')
  return { session, qrCode }
}

export async function checkout(sessionId: string) {
  const session = await db.query.sessions.findFirst({
    where: and(eq(sessions.id, sessionId), eq(sessions.status, 'ACTIVE')),
    with: { rate: true, child: { with: { guardian: true } } },
  })

  if (!session) throw new Error('Active session not found')
  if (!session.timeIn) throw new Error('Session has no time-in recorded')

  const now = new Date()
  // Use rate snapshot so billing is accurate even if rate changed after session started
  const rateForBilling = {
    ...session.rate,
    pricePerHour: session.rateSnapshot?.pricePerHour ?? session.rate.pricePerHour,
    label: session.rateSnapshot?.label ?? session.rate.label,
  }

  return { session, bill: computeBill(session.timeIn, now, rateForBilling), checkoutTime: now }
}

export async function completeSession(
  sessionId: string,
  checkoutTime: Date,
  durationMinutes: number,
  amountCentavos: number,
) {
  const [updated] = await db.update(sessions)
    .set({ status: 'COMPLETED', timeOut: checkoutTime, durationMinutes, amountDue: amountCentavos })
    .where(and(eq(sessions.id, sessionId), eq(sessions.status, 'ACTIVE')))
    .returning()

  if (!updated) throw new Error('Failed to complete session')
  logger.info({ sessionId, amountCentavos, durationMinutes }, 'session.completed')
  return updated
}

export async function getActiveSessions() {
  return db.query.sessions.findMany({
    where: eq(sessions.status, 'ACTIVE'),
    with: { child: { with: { guardian: true } }, rate: true },
    orderBy: (s, { asc }) => [asc(s.timeIn)],
  })
}

export async function cancelSession(sessionId: string) {
  const [session] = await db.update(sessions)
    .set({ status: 'CANCELLED' })
    .where(and(eq(sessions.id, sessionId), eq(sessions.status, 'ACTIVE')))
    .returning()
  return session
}
