import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { generateBatch } from '@/lib/services/qrInventory.service'
import { generateQRDataUrl } from '@/lib/services/qr.service'
import { logAction } from '@/lib/services/audit.service'
import { z } from 'zod'

const GenerateSchema = z.object({ count: z.number().int().min(1).max(200) })

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)
    if (session.user.role !== 'ADMIN') return err('Forbidden', 403)

    const body = await req.json()
    const parsed = GenerateSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const rows = await generateBatch(parsed.data.count)
    const withDataUrls = await Promise.all(
      rows.map(async (row) => ({ ...row, qrDataUrl: await generateQRDataUrl(row.code) })),
    )
    await logAction(session.user.id, 'qr.batchGenerated', { count: rows.length })
    return ok(withDataUrls, 201)
  } catch (e) {
    return serverErr(e)
  }
}
