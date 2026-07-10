import QRCode from 'qrcode'
import { db } from '@/lib/db/client'
import { sessions } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'

export async function generateQRDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, { width: 200, margin: 2, errorCorrectionLevel: 'M' })
}

export async function resolveCode(code: string) {
  // A physical sticker code is reused across many sessions over its lifetime,
  // so resolve to whichever session currently has it checked in, not any
  // historical match.
  return db.query.sessions.findFirst({
    where: and(eq(sessions.qrCode, code), inArray(sessions.status, ['PENDING', 'ACTIVE'])),
    with: {
      child: { with: { guardian: true } },
      rate: true,
      staff: true,
    },
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  }) ?? null
}
