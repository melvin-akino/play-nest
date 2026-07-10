import { db } from '@/lib/db/client'
import { bookingPayments, venueBookings } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { logger } from '@/lib/config/logger'

export const RecordBookingPaymentSchema = z.object({
  type: z.enum(['DEPOSIT', 'BALANCE', 'FULL']),
  amount: z.number().int().positive(),
  method: z.enum(['CASH', 'GCASH']),
})

export type RecordBookingPaymentDTO = z.infer<typeof RecordBookingPaymentSchema>

export async function recordBookingPayment(bookingId: string, dto: RecordBookingPaymentDTO, staffId: string) {
  const booking = await db.query.venueBookings.findFirst({ where: eq(venueBookings.id, bookingId) })
  if (!booking) throw new Error('Booking not found')
  if (booking.status === 'CANCELLED') throw new Error('Cannot record a payment on a cancelled booking')

  const [payment] = await db.insert(bookingPayments).values({
    id: uuidv4(),
    bookingId,
    type: dto.type,
    amount: dto.amount,
    method: dto.method,
    receivedBy: staffId,
  }).returning()

  logger.info({ bookingId, paymentId: payment.id, amount: dto.amount, type: dto.type }, 'bookingPayment.recorded')
  return payment
}

export async function getPaymentsForBooking(bookingId: string) {
  return db.query.bookingPayments.findMany({
    where: eq(bookingPayments.bookingId, bookingId),
    with: { staff: true, voidedByUser: true },
    orderBy: (p, { desc }) => [desc(p.paidAt)],
  })
}

export async function getBookingBalance(bookingId: string) {
  const booking = await db.query.venueBookings.findFirst({ where: eq(venueBookings.id, bookingId) })
  if (!booking) throw new Error('Booking not found')

  const payments = await getPaymentsForBooking(bookingId)
  const paidTotal = payments.filter(p => !p.voided).reduce((sum, p) => sum + p.amount, 0)
  return { totalAmount: booking.totalAmount, paidTotal, balanceDue: booking.totalAmount - paidTotal }
}

export async function voidBookingPayment(paymentId: string, reason: string, adminId: string) {
  const trimmed = reason.trim()
  if (!trimmed) throw new Error('A reason is required to void a payment')

  const payment = await db.query.bookingPayments.findFirst({
    where: and(eq(bookingPayments.id, paymentId), eq(bookingPayments.voided, false)),
  })
  if (!payment) throw new Error('Payment not found')

  const [updated] = await db.update(bookingPayments)
    .set({ voided: true, voidedReason: trimmed, voidedBy: adminId, voidedAt: new Date() })
    .where(eq(bookingPayments.id, paymentId))
    .returning()

  logger.info({ paymentId, reason: trimmed, adminId }, 'bookingPayment.voided')
  return updated
}
