import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { getMonthlySummary, getPeakHours } from '@/lib/services/report.service'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)
    if (session.user.role !== 'ADMIN') return err('Forbidden', 403)

    const now = new Date()
    const year = Number(req.nextUrl.searchParams.get('year') ?? now.getFullYear())
    const month = Number(req.nextUrl.searchParams.get('month') ?? now.getMonth() + 1)

    const [daily, peaks] = await Promise.all([
      getMonthlySummary(year, month),
      getPeakHours(year, month),
    ])

    return ok({ year, month, daily, peaks })
  } catch (e) {
    return serverErr(e)
  }
}
