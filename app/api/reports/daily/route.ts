import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { getDailySummary, getTopSellingItems } from '@/lib/services/report.service'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)
    if (session.user.role !== 'ADMIN') return err('Forbidden', 403)

    const date = req.nextUrl.searchParams.get('date') ?? new Date().toISOString().split('T')[0]
    const [summary, topItems] = await Promise.all([
      getDailySummary(date),
      getTopSellingItems(date),
    ])
    return ok({ ...summary, topItems })
  } catch (e) {
    return serverErr(e)
  }
}
