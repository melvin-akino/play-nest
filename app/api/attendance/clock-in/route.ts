import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { clockIn } from '@/lib/services/attendance.service'
import { listCredentials, verifyClockInChallenge } from '@/lib/services/webauthn.service'
import { logAction } from '@/lib/services/audit.service'
import { z } from 'zod'

const BodySchema = z.object({ webauthnResponse: z.unknown().optional() })

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)

    const body = await req.json().catch(() => ({}))
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    // If the user has enrolled a biometric device, verifying it is
    // required before the clock-in is recorded. Unenrolled users can
    // still clock in with a plain click (gradual rollout, no lockout).
    const enrolled = await listCredentials(session.user.id)
    if (enrolled.length > 0) {
      if (!parsed.data.webauthnResponse) return err('Biometric verification required', 428)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await verifyClockInChallenge(session.user.id, parsed.data.webauthnResponse as any)
    }

    const row = await clockIn(session.user.id)
    await logAction(session.user.id, 'attendance.clockIn', { attendanceId: row.id, biometricVerified: enrolled.length > 0 })
    return ok(row, 201)
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Already clocked in') return err(e.message, 409)
    if (e instanceof Error && (e.message.includes('challenge') || e.message.includes('Credential') || e.message === 'Biometric verification failed')) {
      return err(e.message, 401)
    }
    return serverErr(e)
  }
}
