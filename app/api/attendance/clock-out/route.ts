import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { clockOut } from '@/lib/services/attendance.service'

export async function POST() {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)

    const row = await clockOut(session.user.id)
    return ok(row)
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Not clocked in') return err(e.message, 409)
    return serverErr(e)
  }
}
