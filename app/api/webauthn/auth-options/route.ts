import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { generateClockInChallenge } from '@/lib/services/webauthn.service'

export async function POST() {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)

    const options = await generateClockInChallenge(session.user.id)
    return ok(options)
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'No enrolled biometric device for this account') return err(e.message, 404)
    return serverErr(e)
  }
}
