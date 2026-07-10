import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { listAuditLogs } from '@/lib/services/audit.service'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)
    if (session.user.role !== 'ADMIN') return err('Forbidden', 403)

    const { searchParams } = req.nextUrl
    const userId = searchParams.get('userId') ?? undefined
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const logs = await listAuditLogs({
      userId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    })
    return ok(logs)
  } catch (e) {
    return serverErr(e)
  }
}
