import { listItems } from '@/lib/services/inventory.service'
import { InventoryManager } from '@/components/admin/InventoryManager'

export default async function InventoryPage() {
  const items = await listItems()
  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
      <InventoryManager initialItems={items} />
    </div>
  )
}
