import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { getAttendanceHistory, getMyStatus } from '@/lib/services/attendance.service'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)

    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const userId = searchParams.get('userId') ?? undefined

    if (!from || !to) {
      const status = await getMyStatus(session.user.id)
      return ok({ status })
    }

    // Non-admins may only see their own history; admins may see everyone's
    if (session.user.role !== 'ADMIN' && userId && userId !== session.user.id) {
      return err('Forbidden', 403)
    }
    const effectiveUserId = session.user.role === 'ADMIN' ? userId : session.user.id

    const history = await getAttendanceHistory(new Date(from), new Date(to), effectiveUserId)
    return ok(history)
  } catch (e) {
    return serverErr(e)
  }
}
