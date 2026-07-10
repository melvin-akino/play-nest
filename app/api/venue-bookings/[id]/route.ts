import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { getBooking, updateTotalAmount } from '@/lib/services/venueBooking.service'
import { formatCentavos } from '@/lib/services/billing.service'
import { logAction } from '@/lib/services/audit.service'
import { z } from 'zod'

const PatchSchema = z.object({ totalAmount: z.number().int().positive() })

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)

    const { id } = await params
    const booking = await getBooking(id)
    if (!booking) return err('Booking not found', 404)
    return ok(booking)
  } catch (e) {
    return serverErr(e)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)
    if (session.user.role !== 'ADMIN') return err('Forbidden', 403)

    const { id } = await params
    const body = await req.json()
    const parsed = PatchSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const booking = await updateTotalAmount(id, parsed.data.totalAmount)
    await logAction(session.user.id, 'venueBooking.amountUpdated', { bookingId: id, totalAmount: formatCentavos(parsed.data.totalAmount) })
    return ok(booking)
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Booking not found') return err(e.message, 404)
    if (e instanceof Error && e.message.startsWith('Cannot edit')) return err(e.message, 400)
    return serverErr(e)
  }
}
