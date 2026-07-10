import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { listItems, createItem, CreateItemSchema } from '@/lib/services/inventory.service'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)
    return ok(await listItems())
  } catch (e) {
    return serverErr(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)
    if (session.user.role !== 'ADMIN') return err('Forbidden', 403)

    const body = await req.json()
    const parsed = CreateItemSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const item = await createItem(parsed.data)
    return ok(item, 201)
  } catch (e) {
    return serverErr(e)
  }
}
