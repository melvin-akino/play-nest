import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { verifyEnrollment } from '@/lib/services/webauthn.service'
import { logAction } from '@/lib/services/audit.service'
import { z } from 'zod'

const BodySchema = z.object({
  targetUserId: z.string().uuid().optional(),
  deviceLabel: z.string().optional(),
  response: z.unknown(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)

    const body = await req.json()
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const targetUserId = parsed.data.targetUserId
    if (targetUserId && targetUserId !== session.user.id && session.user.role !== 'ADMIN') {
      return err('Forbidden', 403)
    }
    const effectiveTargetId = targetUserId ?? session.user.id

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const credential = await verifyEnrollment(effectiveTargetId, parsed.data.response as any, parsed.data.deviceLabel)
    await logAction(session.user.id, 'webauthn.enrolled', {
      targetUserId: effectiveTargetId,
      onBehalfOfOther: effectiveTargetId !== session.user.id,
      deviceLabel: parsed.data.deviceLabel,
    })
    return ok({ id: credential.id, deviceLabel: credential.deviceLabel }, 201)
  } catch (e: unknown) {
    if (e instanceof Error) return err(e.message, 400)
    return serverErr(e)
  }
}
