import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { listRates, createRate, CreateRateSchema } from '@/lib/services/rate.service'
import { logAction } from '@/lib/services/audit.service'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)
    return ok(await listRates())
  } catch (e) {
    return serverErr(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)
    if (session.user.role !== 'ADMIN') return err('Forbidden', 403)

    const body = await req.json()
    const parsed = CreateRateSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const rate = await createRate(parsed.data)
    await logAction(session.user.id, 'rate.created', { rateId: rate.id, label: rate.label, pricePerHour: rate.pricePerHour })
    return ok(rate, 201)
  } catch (e) {
    return serverErr(e)
  }
}
