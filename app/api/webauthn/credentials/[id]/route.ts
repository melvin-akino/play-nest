import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { revokeCredential } from '@/lib/services/webauthn.service'
import { logAction } from '@/lib/services/audit.service'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)

    const { id } = await params
    await revokeCredential(id, session.user.id, session.user.role)
    await logAction(session.user.id, 'webauthn.revoked', { credentialId: id })
    return ok({ deleted: true })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Credential not found') return err(e.message, 404)
    if (e instanceof Error && e.message === 'Forbidden') return err(e.message, 403)
    return serverErr(e)
  }
}
