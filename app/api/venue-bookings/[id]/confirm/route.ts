import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { confirmBooking } from '@/lib/services/venueBooking.service'
import { logAction } from '@/lib/services/audit.service'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)

    const { id } = await params
    const booking = await confirmBooking(id)
    await logAction(session.user.id, 'venueBooking.confirmed', { bookingId: id })
    return ok(booking)
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Booking not found') return err(e.message, 404)
    if (e instanceof Error && e.message.startsWith('Cannot move')) return err(e.message, 409)
    return serverErr(e)
  }
}
