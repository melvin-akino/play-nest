import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import {
  findGuardianByPhone,
  createGuardian,
  listGuardians,
  searchGuardians,
  CreateGuardianSchema,
} from '@/lib/services/customer.service'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)

    const { searchParams } = req.nextUrl
    const phone = searchParams.get('phone')
    const query = searchParams.get('q')

    if (phone) return ok(await findGuardianByPhone(phone))
    if (query) return ok(await searchGuardians(query))
    return ok(await listGuardians())
  } catch (e) {
    return serverErr(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)

    const body = await req.json()
    const parsed = CreateGuardianSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const guardian = await createGuardian(parsed.data)
    return ok(guardian, 201)
  } catch (e) {
    return serverErr(e)
  }
}
