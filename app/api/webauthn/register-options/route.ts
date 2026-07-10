import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { generateEnrollmentOptions } from '@/lib/services/webauthn.service'
import { z } from 'zod'

const BodySchema = z.object({ targetUserId: z.string().uuid().optional() })

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)

    const body = await req.json().catch(() => ({}))
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    // Only admins may enroll a device on behalf of someone else; everyone
    // else can only enroll their own account.
    const targetUserId = parsed.data.targetUserId
    if (targetUserId && targetUserId !== session.user.id && session.user.role !== 'ADMIN') {
      return err('Forbidden', 403)
    }

    const options = await generateEnrollmentOptions(targetUserId ?? session.user.id)
    return ok(options)
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'User not found') return err(e.message, 404)
    return serverErr(e)
  }
}
