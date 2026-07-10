import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { listTransactions } from '@/lib/services/payment.service'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)
    if (session.user.role !== 'ADMIN') return err('Forbidden', 403)

    const date = req.nextUrl.searchParams.get('date') ?? new Date().toISOString().split('T')[0]
    const from = new Date(`${date}T00:00:00.000Z`)
    const to = new Date(`${date}T23:59:59.999Z`)

    return ok(await listTransactions(from, to))
  } catch (e) {
    return serverErr(e)
  }
}
