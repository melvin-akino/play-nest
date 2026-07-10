'use client'

import { useEffect, useState } from 'react'

interface LogRow {
  id: string
  action: string
  details: string | null
  createdAt: string
  user: { name: string; email: string }
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    'session.created': 'Started a session',
    'payment.recorded': 'Recorded a payment',
    'attendance.clockIn': 'Clocked in',
    'attendance.clockOut': 'Clocked out',
    'guardian.created': 'Registered a guardian',
    'child.added': 'Added a child',
    'item.created': 'Created an inventory item',
    'item.updated': 'Updated an inventory item',
    'items.sold': 'Sold shop items',
    'qr.manualAdded': 'Added a QR code manually',
    'qr.batchGenerated': 'Generated a QR batch',
    'qr.retired': 'Retired a QR code',
    'rate.created': 'Created a pricing rate',
    'rate.activated': 'Activated a pricing rate',
    'rate.deactivated': 'Deactivated a pricing rate',
    'staff.created': 'Added a staff member',
    'staff.updated': 'Updated a staff member',
  }
  return labels[action] ?? action
}

function formatDetails(details: string | null): string {
  if (!details) return ''
  try {
    const obj = JSON.parse(details)
    return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(' · ')
  } catch {
    return details
  }
}

export function AuditLogViewer() {
  const [from, setFrom] = useState(todayStr())
  const [to, setTo] = useState(todayStr())
  const [logs, setLogs] = useState<LogRow[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    const fromIso = `${from}T00:00:00.000Z`
    const toIso = `${to}T23:59:59.999Z`
    const res = await fetch(`/api/audit-logs?from=${fromIso}&to=${toIso}`)
    const json = await res.json()
    if (json.success) setLogs(json.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [from, to])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 max-h-[32rem] overflow-y-auto">
        {loading && <p className="text-gray-400 text-sm p-4">Loading...</p>}
        {!loading && logs.length === 0 && <p className="text-gray-400 text-sm p-4">No activity in this range.</p>}
        {logs.map(log => (
          <div key={log.id} className="px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900 text-sm">{actionLabel(log.action)}</span>
              <span className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString('en-PH')}</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {log.user.name} ({log.user.email})
              {log.details && <span className="block text-gray-400 mt-0.5">{formatDetails(log.details)}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
