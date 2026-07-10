'use client'

import { useEffect, useState } from 'react'
import { formatCentavos } from '@/lib/services/billing.service'

interface Transaction {
  id: string
  timeOut: string | null
  child: { name: string; guardian: { name: string } }
  staff: { name: string }
  status: 'COMPLETED' | 'VOIDED'
  payment?: {
    amount: number
    method: 'CASH' | 'GCASH'
    voided: boolean
    voidedReason: string | null
    voidedByUser?: { name: string } | null
    voidedAt: string | null
  }
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export function TransactionsManager() {
  const [date, setDate] = useState(todayStr())
  const [rows, setRows] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [voidingId, setVoidingId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/transactions?date=${date}`)
    const json = await res.json()
    if (json.success) setRows(json.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [date])

  async function confirmVoid(sessionId: string) {
    if (!reason.trim()) return
    setError('')
    const res = await fetch(`/api/transactions/${sessionId}/void`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason.trim() }),
    })
    const json = await res.json()
    if (!json.success) { setError(json.error); return }
    setVoidingId(null); setReason('')
    await load()
  }

  const totalToday = rows
    .filter(r => r.status === 'COMPLETED' && r.payment && !r.payment.voided)
    .reduce((sum, r) => sum + (r.payment?.amount ?? 0), 0)

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}

      <div className="flex items-center gap-3">
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <span className="text-sm text-gray-500">
          Total (non-voided): <span className="font-semibold text-gray-900">{formatCentavos(totalToday)}</span>
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {loading && <p className="text-gray-400 text-sm p-4">Loading...</p>}
        {!loading && rows.length === 0 && <p className="text-gray-400 text-sm p-4">No transactions for this date.</p>}
        {rows.map(r => (
          <div key={r.id} className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  {r.child.name}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === 'VOIDED' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {r.status === 'VOIDED' ? 'Voided' : 'Completed'}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Guardian: {r.child.guardian.name} · Served by {r.staff.name}
                  {r.timeOut && ` · ${new Date(r.timeOut).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}`}
                </div>
                {r.status === 'VOIDED' && r.payment && (
                  <div className="text-xs text-red-500 mt-1">
                    Reason: {r.payment.voidedReason} — voided by {r.payment.voidedByUser?.name}
                    {r.payment.voidedAt && ` on ${new Date(r.payment.voidedAt).toLocaleString('en-PH')}`}
                  </div>
                )}
              </div>
              <div className="text-right">
                {r.payment && (
                  <div className={`font-semibold ${r.status === 'VOIDED' ? 'text-gray-400 line-through' : 'text-green-700'}`}>
                    {formatCentavos(r.payment.amount)}
                  </div>
                )}
                {r.payment && <div className="text-xs text-gray-400">{r.payment.method}</div>}
                {r.status === 'COMPLETED' && voidingId !== r.id && (
                  <button onClick={() => { setVoidingId(r.id); setReason('') }}
                    className="text-xs text-red-500 hover:text-red-700 mt-1">
                    Void
                  </button>
                )}
              </div>
            </div>

            {voidingId === r.id && (
              <div className="mt-3 bg-red-50 rounded-lg p-3 space-y-2">
                <label className="text-xs font-medium text-gray-700 block">Reason for voiding this transaction</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                  placeholder="e.g. Wrong child selected, duplicate entry, staff error..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                <div className="flex gap-2">
                  <button onClick={() => confirmVoid(r.id)} disabled={!reason.trim()}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold px-3 py-1.5 rounded-lg">
                    Confirm Void
                  </button>
                  <button onClick={() => { setVoidingId(null); setReason('') }}
                    className="text-sm text-gray-500 hover:underline px-3 py-1.5">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
