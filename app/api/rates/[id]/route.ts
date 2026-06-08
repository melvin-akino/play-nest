import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { setActiveRate, deleteRate } from '@/lib/services/rate.service'

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)
    if (session.user.role !== 'ADMIN') return err('Forbidden', 403)

    const { id } = await params
    const rate = await setActiveRate(id)
    return ok(rate)
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Rate not found') return err(e.message, 404)
    return serverErr(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)
    if (session.user.role !== 'ADMIN') return err('Forbidden', 403)

    const { id } = await params
    await deleteRate(id)
    return ok({ deleted: true })
  } catch (e) {
    return serverErr(e)
  }
}
