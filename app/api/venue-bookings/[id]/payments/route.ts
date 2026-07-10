import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { recordBookingPayment, getPaymentsForBooking, RecordBookingPaymentSchema } from '@/lib/services/bookingPayment.service'
import { formatCentavos } from '@/lib/services/billing.service'
import { logAction } from '@/lib/services/audit.service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)

    const { id } = await params
    return ok(await getPaymentsForBooking(id))
  } catch (e) {
    return serverErr(e)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)

    const { id } = await params
    const body = await req.json()
    const parsed = RecordBookingPaymentSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const payment = await recordBookingPayment(id, parsed.data, session.user.id)
    await logAction(session.user.id, 'bookingPayment.recorded', {
      bookingId: id, amount: formatCentavos(payment.amount), type: payment.type, method: payment.method,
    })
    return ok(payment, 201)
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Booking not found') return err(e.message, 404)
    if (e instanceof Error && e.message.startsWith('Cannot record')) return err(e.message, 400)
    return serverErr(e)
  }
}
