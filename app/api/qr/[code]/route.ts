import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { resolveCode } from '@/lib/services/qr.service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)

    const { code } = await params
    const result = await resolveCode(code)
    if (!result) return err('QR code not found', 404)
    return ok(result)
  } catch (e) {
    return serverErr(e)
  }
}
