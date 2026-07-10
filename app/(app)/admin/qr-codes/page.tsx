import { listCodes } from '@/lib/services/qrInventory.service'
import { generateQRDataUrl } from '@/lib/services/qr.service'
import { QrCodeManager } from '@/components/admin/QrCodeManager'

export default async function QrCodesPage() {
  const codes = await listCodes()
  const withDataUrls = await Promise.all(
    codes.map(async (c) => ({ ...c, qrDataUrl: await generateQRDataUrl(c.code) })),
  )
  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900">QR Sticker Inventory</h1>
      <QrCodeManager initialCodes={withDataUrls} />
    </div>
  )
}
