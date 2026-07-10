import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { retireCode } from '@/lib/services/qrInventory.service'
import { logAction } from '@/lib/services/audit.service'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)
    if (session.user.role !== 'ADMIN') return err('Forbidden', 403)

    const { id } = await params
    await retireCode(id)
    await logAction(session.user.id, 'qr.retired', { qrCodeId: id })
    return ok({ deleted: true })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'QR code not found') return err(e.message, 404)
    if (e instanceof Error && e.message === 'Cannot retire a code currently in use') return err(e.message, 409)
    return serverErr(e)
  }
}
