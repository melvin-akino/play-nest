'use client'

import { useState } from 'react'
import { formatCentavos } from '@/lib/services/billing.service'
import type { Item } from '@/lib/db/schema'

interface Props {
  initialItems: Item[]
}

export function InventoryManager({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems)
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [category, setCategory] = useState('General')
  const [price, setPrice] = useState('')
  const [stockQty, setStockQty] = useState('0')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function reload() {
    const res = await fetch('/api/inventory/items')
    const json = await res.json()
    if (json.success) setItems(json.data)
  }

  async function createItem() {
    const priceCentavos = Math.round(parseFloat(price) * 100)
    if (!name || !sku || isNaN(priceCentavos) || priceCentavos <= 0) return
    setLoading(true); setError('')
    const res = await fetch('/api/inventory/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, sku, category, price: priceCentavos, stockQty: parseInt(stockQty) }),
    })
    const json = await res.json()
    if (!json.success) { setError(json.error); setLoading(false); return }
    setName(''); setSku(''); setCategory('General'); setPrice(''); setStockQty('0')
    await reload()
    setLoading(false)
  }

  async function toggleActive(item: Item) {
    await fetch(`/api/inventory/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !item.isActive }),
    })
    await reload()
  }

  async function adjustStock(item: Item, delta: number) {
    const newQty = item.stockQty + delta
    if (newQty < 0) return
    await fetch(`/api/inventory/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stockQty: newQty }),
    })
    await reload()
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {items.length === 0 && <p className="text-gray-400 text-sm p-4">No items yet.</p>}
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="font-medium text-gray-900 flex items-center gap-2">
                {item.name}
                {!item.isActive && <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-medium">Inactive</span>}
                {item.stockQty <= item.lowStockThreshold && (
                  <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">Low Stock</span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {item.sku} · {item.category} · {formatCentavos(item.price)} · Stock: {item.stockQty}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => adjustStock(item, -1)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold">−</button>
              <button onClick={() => adjustStock(item, 1)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold">+</button>
              <button onClick={() => toggleActive(item)} className="text-sm text-blue-600 hover:underline font-medium ml-2">
                {item.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h3 className="font-semibold text-gray-800 text-sm">Add New Item</h3>
        <div className="flex gap-2">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Item name"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={sku} onChange={e => setSku(e.target.value)} placeholder="SKU"
            className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-2">
          <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Category"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="w-28">
            <label className="text-xs text-gray-500 mb-1 block">Price (₱)</label>
            <input value={price} onChange={e => setPrice(e.target.value)} type="number" step="0.01" placeholder="25.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="w-24">
            <label className="text-xs text-gray-500 mb-1 block">Stock</label>
            <input value={stockQty} onChange={e => setStockQty(e.target.value)} type="number" min="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <button onClick={createItem} disabled={loading || !name || !sku || !price}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          {loading ? 'Saving...' : 'Add Item'}
        </button>
      </div>
    </div>
  )
}
