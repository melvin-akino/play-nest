'use client'

import { useState } from 'react'
import { usePrintQrStickers } from '@/components/print/QrStickerSheet'
import type { QrCode } from '@/lib/db/schema'

interface Props {
  initialCodes: QrCode[]
}

export function QrCodeManager({ initialCodes }: Props) {
  const [codes, setCodes] = useState(initialCodes)
  const [count, setCount] = useState('20')
  const [manualCode, setManualCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const printStickers = usePrintQrStickers()

  async function reload() {
    const res = await fetch('/api/qr-codes')
    const json = await res.json()
    if (json.success) setCodes(json.data)
  }

  async function generateAndPrint() {
    const n = parseInt(count)
    if (isNaN(n) || n < 1) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/qr-codes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: n }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.error); return }
      printStickers(json.data.map((r: { code: string; qrDataUrl: string }) => ({ code: r.code, qrDataUrl: r.qrDataUrl })))
      await reload()
    } finally {
      setLoading(false)
    }
  }

  async function addManual() {
    if (!manualCode.trim()) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/qr-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: manualCode.trim() }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.error); return }
      setManualCode('')
      await reload()
    } finally {
      setLoading(false)
    }
  }

  async function printAvailable() {
    const res = await fetch('/api/qr-codes?status=AVAILABLE&withDataUrl=true')
    const json = await res.json()
    if (json.success) printStickers(json.data.map((r: { code: string; qrDataUrl: string }) => ({ code: r.code, qrDataUrl: r.qrDataUrl })))
  }

  async function retire(id: string) {
    await fetch(`/api/qr-codes/${id}`, { method: 'DELETE' })
    await reload()
  }

  const availableCount = codes.filter(c => c.status === 'AVAILABLE').length
  const assignedCount = codes.filter(c => c.status === 'ASSIGNED').length

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Available</p>
          <p className="text-2xl font-bold text-green-700">{availableCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">In Use</p>
          <p className="text-2xl font-bold text-blue-700">{assignedCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h3 className="font-semibold text-gray-800 text-sm">Generate New Sticker Batch</h3>
        <div className="flex gap-2">
          <input value={count} onChange={e => setCount(e.target.value)} type="number" min="1" max="200"
            className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={generateAndPrint} disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg">
            {loading ? 'Generating...' : 'Generate & Print'}
          </button>
        </div>
        <p className="text-xs text-gray-400">Prints a sticker sheet ready for sticker paper. Codes look like JG-A1B2C3.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h3 className="font-semibold text-gray-800 text-sm">Add a Specific Code Manually</h3>
        <div className="flex gap-2">
          <input value={manualCode} onChange={e => setManualCode(e.target.value)} placeholder="e.g. JG-0001"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={addManual} disabled={loading || !manualCode.trim()}
            className="bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg">
            Add
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={printAvailable} disabled={availableCount === 0}
          className="text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 px-3 py-2 rounded-lg font-medium">
          Print All Available ({availableCount})
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {codes.length === 0 && <p className="text-gray-400 text-sm p-4">No QR codes yet.</p>}
        {codes.map(c => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="font-mono font-medium text-gray-900">{c.code}</div>
              <div className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString('en-PH')}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {c.status === 'AVAILABLE' ? 'Available' : 'In Use'}
              </span>
              {c.status === 'AVAILABLE' && (
                <button onClick={() => retire(c.id)} className="text-xs text-red-500 hover:text-red-700">Retire</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
