import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { voidTransaction } from '@/lib/services/payment.service'
import { formatCentavos } from '@/lib/services/billing.service'
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

    const result = await voidTransaction(id, parsed.data.reason, session.user.id)
    await logAction(session.user.id, 'payment.voided', {
      sessionId: id,
      amount: formatCentavos(result.payment.amount),
      reason: parsed.data.reason,
    })
    return ok(result)
  } catch (e: unknown) {
    if (e instanceof Error && (
      e.message === 'Session not found' ||
      e.message === 'Payment not found for this session'
    )) return err(e.message, 404)
    if (e instanceof Error && (
      e.message === 'Only completed transactions can be voided' ||
      e.message === 'A reason is required to void a transaction'
    )) return err(e.message, 400)
    return serverErr(e)
  }
}
