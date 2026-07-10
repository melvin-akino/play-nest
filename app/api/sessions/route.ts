import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { createSession } from '@/lib/services/session.service'
import { getActiveRate } from '@/lib/services/rate.service'
import { generateQRDataUrl } from '@/lib/services/qr.service'
import { logAction } from '@/lib/services/audit.service'
import { z } from 'zod'

const CreateSessionSchema = z.object({
  childId: z.string().uuid(),
  qrCode: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)

    const body = await req.json()
    const parsed = CreateSessionSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const rate = await getActiveRate()
    const { session: newSession, qrCode } = await createSession(
      parsed.data.childId,
      rate.id,
      session.user.id,
      rate,
      parsed.data.qrCode,
    )

    const qrDataUrl = await generateQRDataUrl(qrCode)
    await logAction(session.user.id, 'session.created', { sessionId: newSession.id, childId: parsed.data.childId, qrCode })
    return ok({ session: newSession, qrDataUrl, qrCode }, 201)
  } catch (e: unknown) {
    if (e instanceof Error && (e.message === 'QR code not found in inventory' || e.message === 'QR code is already in use')) {
      return err(e.message, 409)
    }
    return serverErr(e)
  }
}
