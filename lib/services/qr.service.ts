import QRCode from 'qrcode'
import { db } from '@/lib/db/client'
import { sessions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function generateQRDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, { width: 200, margin: 2, errorCorrectionLevel: 'M' })
}

export async function resolveCode(code: string) {
  return db.query.sessions.findFirst({
    where: eq(sessions.qrCode, code),
    with: {
      child: { with: { guardian: true } },
      rate: true,
      staff: true,
    },
  }) ?? null
}
