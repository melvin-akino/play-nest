import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { clockIn } from '@/lib/services/attendance.service'
import { logAction } from '@/lib/services/audit.service'

export async function POST() {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)

    const row = await clockIn(session.user.id)
    await logAction(session.user.id, 'attendance.clockIn', { attendanceId: row.id })
    return ok(row, 201)
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Already clocked in') return err(e.message, 409)
    return serverErr(e)
  }
}
