import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { getActiveSessions } from '@/lib/services/session.service'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)

    const active = await getActiveSessions()
    return ok(active)
  } catch (e) {
    return serverErr(e)
  }
}
