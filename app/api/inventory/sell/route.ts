import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { sellItems, SellCartSchema } from '@/lib/services/inventory.service'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)

    const body = await req.json()
    const parsed = SellCartSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const result = await sellItems(parsed.data, session.user.id)
    return ok(result, 201)
  } catch (e: unknown) {
    if (e instanceof Error && (e.message.includes('Insufficient stock') || e.message.includes('not found') || e.message.includes('not active'))) {
      return err(e.message, 400)
    }
    return serverErr(e)
  }
}
