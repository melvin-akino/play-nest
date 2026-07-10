import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { checkout } from '@/lib/services/session.service'
import { recordPayment, RecordPaymentSchema } from '@/lib/services/payment.service'
import { formatCentavos } from '@/lib/services/billing.service'
import { logAction } from '@/lib/services/audit.service'

// GET: preview bill before payment
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)

    const { id } = await params
    const result = await checkout(id)
    return ok(result)
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Active session not found') return err(e.message, 404)
    return serverErr(e)
  }
}

// POST: finalize payment
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)

    const { id } = await params
    const body = await req.json()
    const parsed = RecordPaymentSchema.safeParse({ ...body, sessionId: id })
    if (!parsed.success) return err(parsed.error.message)

    const result = await recordPayment(parsed.data, session.user.id)
    await logAction(session.user.id, 'payment.recorded', { sessionId: id, amount: formatCentavos(parsed.data.amount), method: parsed.data.method })
    return ok(result)
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes('not found')) return err(e.message, 404)
    return serverErr(e)
  }
}
