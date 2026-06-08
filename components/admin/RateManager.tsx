'use client'

import { useState } from 'react'
import { formatCentavos } from '@/lib/services/billing.service'
import type { Rate } from '@/lib/db/schema'

interface Props {
  initialRates: Rate[]
}

export function RateManager({ initialRates }: Props) {
  const [rates, setRates] = useState(initialRates)
  const [label, setLabel] = useState('')
  const [pricePerHour, setPricePerHour] = useState('')
  const [minMinutes, setMinMinutes] = useState('30')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function reload() {
    const res = await fetch('/api/rates')
    const json = await res.json()
    if (json.success) setRates(json.data)
  }

  async function createRate() {
    const priceCentavos = Math.round(parseFloat(pricePerHour) * 100)
    if (!label || isNaN(priceCentavos) || priceCentavos <= 0) return
    setLoading(true); setError('')
    const res = await fetch('/api/rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, pricePerHour: priceCentavos, minMinutes: parseInt(minMinutes) }),
    })
    const json = await res.json()
    if (!json.success) { setError(json.error); setLoading(false); return }
    setLabel(''); setPricePerHour(''); setMinMinutes('30')
    await reload()
    setLoading(false)
  }

  async function setActive(id: string) {
    await fetch(`/api/rates/${id}`, { method: 'PATCH' })
    await reload()
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {rates.length === 0 && <p className="text-gray-400 text-sm p-4">No rates yet.</p>}
        {rates.map(r => (
          <div key={r.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="font-medium text-gray-900 flex items-center gap-2">
                {r.label}
                {r.isActive && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Active</span>}
              </div>
              <div className="text-sm text-gray-500">
                {formatCentavos(r.pricePerHour)}/hr · min {r.minMinutes}m
              </div>
            </div>
            {!r.isActive && (
              <button onClick={() => setActive(r.id)}
                className="text-sm text-blue-600 hover:underline font-medium">
                Set Active
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h3 className="font-semibold text-gray-800 text-sm">Add New Rate</h3>
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label (e.g. Weekend Rate)"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Price per Hour (₱)</label>
            <input value={pricePerHour} onChange={e => setPricePerHour(e.target.value)} type="number" step="0.01" placeholder="60.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="w-32">
            <label className="text-xs text-gray-500 mb-1 block">Min Minutes</label>
            <input value={minMinutes} onChange={e => setMinMinutes(e.target.value)} type="number" min="1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <button onClick={createRate} disabled={loading || !label || !pricePerHour}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          {loading ? 'Saving...' : 'Add Rate'}
        </button>
      </div>
    </div>
  )
}
