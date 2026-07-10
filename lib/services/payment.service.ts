import { db } from '@/lib/db/client'
import { payments, sessions } from '@/lib/db/schema'
import { eq, and, gte, lte, inArray } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { completeSession } from './session.service'
import { logger } from '@/lib/config/logger'

export const RecordPaymentSchema = z.object({
  sessionId: z.string().uuid(),
  amount: z.number().int().positive(),
  method: z.enum(['CASH', 'GCASH']),
  checkoutTime: z.string().datetime(),
  durationMinutes: z.number().int().positive(),
})

export type RecordPaymentDTO = z.infer<typeof RecordPaymentSchema>

export async function recordPayment(dto: RecordPaymentDTO, staffId: string) {
  const checkoutTime = new Date(dto.checkoutTime)

  // Complete session and record payment atomically
  const session = await completeSession(dto.sessionId, checkoutTime, dto.durationMinutes, dto.amount)

  const [payment] = await db.insert(payments).values({
    id: uuidv4(),
    sessionId: dto.sessionId,
    amount: dto.amount,
    method: dto.method,
    receivedBy: staffId,
  }).returning()

  logger.info({ paymentId: payment.id, sessionId: dto.sessionId, amount: dto.amount, method: dto.method }, 'payment.recorded')
  return { session, payment }
}

export async function getPaymentBySession(sessionId: string) {
  return db.query.payments.findFirst({
    where: eq(payments.sessionId, sessionId),
    with: { staff: true },
  })
}

export async function listTransactions(from: Date, to: Date) {
  return db.query.sessions.findMany({
    where: and(
      inArray(sessions.status, ['COMPLETED', 'VOIDED']),
      gte(sessions.timeOut, from),
      lte(sessions.timeOut, to),
    ),
    with: {
      child: { with: { guardian: true } },
      staff: true,
    },
    orderBy: (s, { desc }) => [desc(s.timeOut)],
  }).then(async (sessionRows) => {
    // Attach each session's payment (including voided ones) for display
    const withPayments = await Promise.all(sessionRows.map(async (s) => {
      const payment = await db.query.payments.findFirst({
        where: eq(payments.sessionId, s.id),
        with: { staff: true, voidedByUser: true },
      })
      return { ...s, payment }
    }))
    return withPayments
  })
}

export async function voidTransaction(sessionId: string, reason: string, adminId: string) {
  const trimmedReason = reason.trim()
  if (!trimmedReason) throw new Error('A reason is required to void a transaction')

  const session = await db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) })
  if (!session) throw new Error('Session not found')
  if (session.status !== 'COMPLETED') throw new Error('Only completed transactions can be voided')

  const payment = await db.query.payments.findFirst({
    where: and(eq(payments.sessionId, sessionId), eq(payments.voided, false)),
  })
  if (!payment) throw new Error('Payment not found for this session')

  const now = new Date()
  const [voidedPayment] = await db.update(payments)
    .set({ voided: true, voidedReason: trimmedReason, voidedBy: adminId, voidedAt: now })
    .where(eq(payments.id, payment.id))
    .returning()

  const [voidedSession] = await db.update(sessions)
    .set({ status: 'VOIDED' })
    .where(eq(sessions.id, sessionId))
    .returning()

  logger.info({ sessionId, paymentId: payment.id, reason: trimmedReason, adminId }, 'payment.voided')
  return { session: voidedSession, payment: voidedPayment }
}
