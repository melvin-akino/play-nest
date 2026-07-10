import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { voidBookingPayment } from '@/lib/services/bookingPayment.service'
import { logAction } from '@/lib/services/audit.service'
import { z } from 'zod'

const VoidSchema = z.object({ reason: z.string().min(1) })

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)
    if (session.user.role !== 'ADMIN') return err('Forbidden', 403)

    const { id } = await params
    const body = await req.json()
    const parsed = VoidSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const payment = await voidBookingPayment(id, parsed.data.reason, session.user.id)
    await logAction(session.user.id, 'bookingPayment.voided', { paymentId: id, reason: parsed.data.reason })
    return ok(payment)
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Payment not found') return err(e.message, 404)
    if (e instanceof Error && e.message === 'A reason is required to void a payment') return err(e.message, 400)
    return serverErr(e)
  }
}
