import { db } from '@/lib/db/client'
import { venueBookings } from '@/lib/db/schema'
import { eq, and, gte, lte, inArray } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { logger } from '@/lib/config/logger'
import type { VenueBookingStatus } from '@/lib/db/schema'

export const CreateBookingSchema = z.object({
  packageId: z.string().uuid().optional(),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  eventName: z.string().optional(),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
  guestCountEstimate: z.number().int().positive().optional(),
  pricingType: z.enum(['FLAT', 'HOURLY']),
  totalAmount: z.number().int().positive(), // centavos
  exclusive: z.boolean().default(true),
  notes: z.string().optional(),
})

export type CreateBookingDTO = z.infer<typeof CreateBookingSchema>

export async function createBooking(dto: CreateBookingDTO, staffId: string) {
  const start = new Date(dto.scheduledStart)
  const end = new Date(dto.scheduledEnd)
  if (end <= start) throw new Error('End time must be after start time')

  const [booking] = await db.insert(venueBookings).values({
    id: uuidv4(),
    packageId: dto.packageId,
    customerName: dto.customerName,
    customerPhone: dto.customerPhone,
    eventName: dto.eventName,
    scheduledStart: start,
    scheduledEnd: end,
    guestCountEstimate: dto.guestCountEstimate,
    pricingType: dto.pricingType,
    totalAmount: dto.totalAmount,
    exclusive: dto.exclusive,
    notes: dto.notes,
    createdBy: staffId,
  }).returning()

  logger.info({ bookingId: booking.id, customerName: dto.customerName }, 'venueBooking.created')
  return booking
}

export async function listBookings(from: Date, to: Date) {
  return db.query.venueBookings.findMany({
    where: and(gte(venueBookings.scheduledStart, from), lte(venueBookings.scheduledStart, to)),
    with: { package: true, createdByUser: true, cancelledByUser: true },
    orderBy: (b, { asc }) => [asc(b.scheduledStart)],
  })
}

export async function getBooking(id: string) {
  return db.query.venueBookings.findFirst({
    where: eq(venueBookings.id, id),
    with: { package: true, createdByUser: true, cancelledByUser: true },
  })
}

async function transition(
  id: string,
  from: VenueBookingStatus[],
  to: VenueBookingStatus,
  extra: Partial<{ actualStart: Date; actualEnd: Date }> = {},
) {
  const booking = await db.query.venueBookings.findFirst({ where: eq(venueBookings.id, id) })
  if (!booking) throw new Error('Booking not found')
  if (!from.includes(booking.status as VenueBookingStatus)) throw new Error(`Cannot move booking from ${booking.status} to ${to}`)

  const [updated] = await db.update(venueBookings)
    .set({ status: to, ...extra })
    .where(eq(venueBookings.id, id))
    .returning()
  return updated
}

export async function confirmBooking(id: string) {
  return transition(id, ['RESERVED'], 'CONFIRMED')
}

export async function checkInBooking(id: string) {
  return transition(id, ['RESERVED', 'CONFIRMED'], 'ACTIVE', { actualStart: new Date() })
}

export async function checkOutBooking(id: string) {
  return transition(id, ['ACTIVE'], 'COMPLETED', { actualEnd: new Date() })
}

export async function cancelBooking(id: string, reason: string, adminId: string) {
  const trimmed = reason.trim()
  if (!trimmed) throw new Error('A reason is required to cancel a booking')

  const booking = await db.query.venueBookings.findFirst({ where: eq(venueBookings.id, id) })
  if (!booking) throw new Error('Booking not found')
  if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
    throw new Error(`Cannot cancel a ${booking.status.toLowerCase()} booking`)
  }

  const [updated] = await db.update(venueBookings)
    .set({ status: 'CANCELLED', cancelReason: trimmed, cancelledBy: adminId, cancelledAt: new Date() })
    .where(eq(venueBookings.id, id))
    .returning()

  logger.info({ bookingId: id, reason: trimmed, adminId }, 'venueBooking.cancelled')
  return updated
}

export async function updateTotalAmount(id: string, totalAmount: number) {
  const booking = await db.query.venueBookings.findFirst({ where: eq(venueBookings.id, id) })
  if (!booking) throw new Error('Booking not found')
  if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
    throw new Error(`Cannot edit a ${booking.status.toLowerCase()} booking`)
  }

  const [updated] = await db.update(venueBookings).set({ totalAmount }).where(eq(venueBookings.id, id)).returning()
  return updated
}

// Exclusive bookings scheduled for "today" — surfaced as a Front Desk warning
export async function getExclusiveBookingsToday() {
  const now = new Date()
  const start = new Date(now); start.setHours(0, 0, 0, 0)
  const end = new Date(now); end.setHours(23, 59, 59, 999)

  return db.query.venueBookings.findMany({
    where: and(
      eq(venueBookings.exclusive, true),
      inArray(venueBookings.status, ['CONFIRMED', 'ACTIVE']),
      gte(venueBookings.scheduledStart, start),
      lte(venueBookings.scheduledStart, end),
    ),
    orderBy: (b, { asc }) => [asc(b.scheduledStart)],
  })
}
