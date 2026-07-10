import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { listCredentials } from '@/lib/services/webauthn.service'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)

    const targetUserId = req.nextUrl.searchParams.get('userId')
    if (targetUserId && targetUserId !== session.user.id && session.user.role !== 'ADMIN') {
      return err('Forbidden', 403)
    }

    const rows = await listCredentials(targetUserId ?? session.user.id)
    return ok(rows.map(r => ({ id: r.id, deviceLabel: r.deviceLabel, createdAt: r.createdAt })))
  } catch (e) {
    return serverErr(e)
  }
}
