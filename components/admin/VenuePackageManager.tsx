'use client'

import { useEffect, useState } from 'react'
import { formatCentavos } from '@/lib/services/billing.service'

interface VenuePackage {
  id: string
  label: string
  pricingType: 'FLAT' | 'HOURLY'
  amount: number
  isActive: boolean
}

export function VenuePackageManager() {
  const [packages, setPackages] = useState<VenuePackage[]>([])
  const [label, setLabel] = useState('')
  const [pricingType, setPricingType] = useState<'FLAT' | 'HOURLY'>('FLAT')
  const [amount, setAmount] = useState('')
  const [open, setOpen] = useState(false)

  async function reload() {
    const res = await fetch('/api/venue-packages')
    const json = await res.json()
    if (json.success) setPackages(json.data)
  }

  useEffect(() => { reload() }, [])

  async function create() {
    const centavos = Math.round(parseFloat(amount) * 100)
    if (!label || isNaN(centavos) || centavos <= 0) return
    await fetch('/api/venue-packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, pricingType, amount: centavos }),
    })
    setLabel(''); setAmount('')
    await reload()
  }

  async function toggle(pkg: VenuePackage) {
    await fetch(`/api/venue-packages/${pkg.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !pkg.isActive }),
    })
    await reload()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <button onClick={() => setOpen(v => !v)} className="text-sm font-semibold text-gray-800 flex items-center gap-1">
        Venue Packages {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className="space-y-3">
          <div className="divide-y divide-gray-100 border rounded-lg">
            {packages.length === 0 && <p className="text-gray-400 text-sm p-3">No packages yet.</p>}
            {packages.map(p => (
              <div key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className={p.isActive ? '' : 'text-gray-400 line-through'}>
                  {p.label} — {formatCentavos(p.amount)}{p.pricingType === 'HOURLY' ? '/hr' : ''}
                </span>
                <button onClick={() => toggle(p)} className="text-xs text-blue-600 hover:underline">
                  {p.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Package label"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={pricingType} onChange={e => setPricingType(e.target.value as 'FLAT' | 'HOURLY')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="FLAT">Flat</option>
              <option value="HOURLY">Hourly</option>
            </select>
            <input value={amount} onChange={e => setAmount(e.target.value)} type="number" step="0.01" placeholder="₱"
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={create} disabled={!label || !amount}
              className="bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg">
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
