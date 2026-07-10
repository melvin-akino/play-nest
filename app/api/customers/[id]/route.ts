import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { getGuardian, addChild, CreateChildSchema } from '@/lib/services/customer.service'
import { logAction } from '@/lib/services/audit.service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)

    const { id } = await params
    const guardian = await getGuardian(id)
    if (!guardian) return err('Guardian not found', 404)
    return ok(guardian)
  } catch (e) {
    return serverErr(e)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)

    const { id } = await params
    const body = await req.json()
    const parsed = CreateChildSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const child = await addChild(id, parsed.data)
    await logAction(session.user.id, 'child.added', { childId: child.id, guardianId: id, name: child.name })
    return ok(child, 201)
  } catch (e) {
    return serverErr(e)
  }
}
