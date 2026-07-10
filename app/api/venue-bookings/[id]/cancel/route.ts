import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { cancelBooking } from '@/lib/services/venueBooking.service'
import { logAction } from '@/lib/services/audit.service'
import { z } from 'zod'

const CancelSchema = z.object({ reason: z.string().min(1) })

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)
    if (session.user.role !== 'ADMIN') return err('Forbidden', 403)

    const { id } = await params
    const body = await req.json()
    const parsed = CancelSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const booking = await cancelBooking(id, parsed.data.reason, session.user.id)
    await logAction(session.user.id, 'venueBooking.cancelled', { bookingId: id, reason: parsed.data.reason })
    return ok(booking)
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Booking not found') return err(e.message, 404)
    if (e instanceof Error && (e.message.startsWith('Cannot cancel') || e.message === 'A reason is required to cancel a booking')) {
      return err(e.message, 400)
    }
    return serverErr(e)
  }
}
