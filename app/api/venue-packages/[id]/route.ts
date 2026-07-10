import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { setVenuePackageActive } from '@/lib/services/venuePackage.service'
import { logAction } from '@/lib/services/audit.service'
import { z } from 'zod'

const PatchSchema = z.object({ isActive: z.boolean() })

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)
    if (session.user.role !== 'ADMIN') return err('Forbidden', 403)

    const { id } = await params
    const body = await req.json()
    const parsed = PatchSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const pkg = await setVenuePackageActive(id, parsed.data.isActive)
    await logAction(session.user.id, 'venuePackage.updated', { packageId: id, isActive: parsed.data.isActive })
    return ok(pkg)
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Package not found') return err(e.message, 404)
    return serverErr(e)
  }
}
