import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { listCodes, addManualCode } from '@/lib/services/qrInventory.service'
import { generateQRDataUrl } from '@/lib/services/qr.service'
import { z } from 'zod'

const ManualCodeSchema = z.object({ code: z.string().min(1) })

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)
    if (session.user.role !== 'ADMIN') return err('Forbidden', 403)

    const statusParam = req.nextUrl.searchParams.get('status')
    const status = statusParam === 'AVAILABLE' || statusParam === 'ASSIGNED' ? statusParam : undefined
    const rows = await listCodes(status)

    if (req.nextUrl.searchParams.get('withDataUrl') === 'true') {
      const withDataUrls = await Promise.all(
        rows.map(async (row) => ({ ...row, qrDataUrl: await generateQRDataUrl(row.code) })),
      )
      return ok(withDataUrls)
    }
    return ok(rows)
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
    const parsed = ManualCodeSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const row = await addManualCode(parsed.data.code)
    return ok(row, 201)
  } catch (e: unknown) {
    if (e instanceof Error && (e.message === 'Code already exists' || e.message === 'Code cannot be empty')) {
      return err(e.message, 409)
    }
    return serverErr(e)
  }
}
