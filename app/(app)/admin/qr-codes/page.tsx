import { listCodes } from '@/lib/services/qrInventory.service'
import { QrCodeManager } from '@/components/admin/QrCodeManager'

export default async function QrCodesPage() {
  const codes = await listCodes()
  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900">QR Sticker Inventory</h1>
      <QrCodeManager initialCodes={codes} />
    </div>
  )
}
