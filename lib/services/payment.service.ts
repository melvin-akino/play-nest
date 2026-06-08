import { db } from '@/lib/db/client'
import { payments } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
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
