import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { updateItem, CreateItemSchema } from '@/lib/services/inventory.service'
import { formatCentavos } from '@/lib/services/billing.service'
import { logAction } from '@/lib/services/audit.service'
import { z } from 'zod'

const PatchSchema = CreateItemSchema.partial().extend({ isActive: z.boolean().optional() })

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)
    if (session.user.role !== 'ADMIN') return err('Forbidden', 403)

    const { id } = await params
    const body = await req.json()
    const parsed = PatchSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const item = await updateItem(id, parsed.data)
    const changes = { ...parsed.data, ...(parsed.data.price != null ? { price: formatCentavos(parsed.data.price) } : {}) }
    await logAction(session.user.id, 'item.updated', { itemId: id, changes })
    return ok(item)
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Item not found') return err(e.message, 404)
    return serverErr(e)
  }
}
