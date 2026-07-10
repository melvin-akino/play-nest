'use client'

import { useEffect, useState } from 'react'
import { formatCentavos } from '@/lib/services/billing.service'

interface Item {
  id: string
  name: string
  price: number
  stockQty: number
  isActive: boolean
}

interface CartLine {
  itemId: string
  name: string
  price: number
  quantity: number
}

interface Props {
  onClose: () => void
  onCompleted: () => void
}

export function ShopModal({ onClose, onCompleted }: Props) {
  const [items, setItems] = useState<Item[]>([])
  const [cart, setCart] = useState<CartLine[]>([])
  const [method, setMethod] = useState<'CASH' | 'GCASH'>('CASH')
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/inventory/items')
      .then(r => r.json())
      .then(j => { if (j.success) setItems(j.data.filter((i: Item) => i.isActive)) })
      .finally(() => setLoading(false))
  }, [])

  function addToCart(item: Item) {
    setCart(prev => {
      const existing = prev.find(l => l.itemId === item.id)
      if (existing) {
        if (existing.quantity >= item.stockQty) return prev
        return prev.map(l => l.itemId === item.id ? { ...l, quantity: l.quantity + 1 } : l)
      }
      if (item.stockQty < 1) return prev
      return [...prev, { itemId: item.id, name: item.name, price: item.price, quantity: 1 }]
    })
  }

  function removeFromCart(itemId: string) {
    setCart(prev => prev.flatMap(l => {
      if (l.itemId !== itemId) return [l]
      if (l.quantity <= 1) return []
      return [{ ...l, quantity: l.quantity - 1 }]
    }))
  }

  const total = cart.reduce((sum, l) => sum + l.price * l.quantity, 0)

  async function confirmSale() {
    if (cart.length === 0) return
    setPaying(true); setError('')
    try {
      const res = await fetch('/api/inventory/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart: cart.map(l => ({ itemId: l.itemId, quantity: l.quantity })),
          paymentMethod: method,
        }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.error); return }
      onCompleted()
    } catch {
      setError('Sale failed')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Shop</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}

          {loading && <div className="text-center text-gray-400 py-8">Loading items...</div>}

          {!loading && (
            <div className="grid grid-cols-2 gap-2">
              {items.map(item => (
                <button key={item.id} onClick={() => addToCart(item)} disabled={item.stockQty < 1}
                  className="text-left border border-gray-200 rounded-xl p-3 hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed">
                  <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                  <div className="text-xs text-gray-500">{formatCentavos(item.price)} · {item.stockQty} left</div>
                </button>
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              {cart.map(l => (
                <div key={l.itemId} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{l.name} × {l.quantity}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatCentavos(l.price * l.quantity)}</span>
                    <button onClick={() => removeFromCart(l.itemId)} className="text-red-500 hover:text-red-700 text-xs">Remove</button>
                  </div>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>{formatCentavos(total)}</span>
              </div>
            </div>
          )}

          {cart.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Payment Method</p>
              <div className="grid grid-cols-2 gap-2">
                {(['CASH', 'GCASH'] as const).map(m => (
                  <button key={m} onClick={() => setMethod(m)}
                    className={`py-3 rounded-xl font-semibold text-sm border-2 transition-colors ${method === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 pt-0">
            <button onClick={confirmSale} disabled={paying}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-base">
              {paying ? 'Processing...' : `Confirm ${method} Sale — ${formatCentavos(total)}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
