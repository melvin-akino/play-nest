import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { listBookings, createBooking, CreateBookingSchema } from '@/lib/services/venueBooking.service'
import { formatCentavos } from '@/lib/services/billing.service'
import { logAction } from '@/lib/services/audit.service'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)

    const dateParam = req.nextUrl.searchParams.get('date')
    const from = dateParam ? new Date(`${dateParam}T00:00:00.000Z`) : new Date(0)
    const to = dateParam ? new Date(`${dateParam}T23:59:59.999Z`) : new Date(8640000000000000)

    return ok(await listBookings(from, to))
  } catch (e) {
    return serverErr(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)

    const body = await req.json()
    const parsed = CreateBookingSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const booking = await createBooking(parsed.data, session.user.id)
    await logAction(session.user.id, 'venueBooking.created', {
      bookingId: booking.id, customerName: booking.customerName, totalAmount: formatCentavos(booking.totalAmount),
    })
    return ok(booking, 201)
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'End time must be after start time') return err(e.message, 400)
    return serverErr(e)
  }
}
