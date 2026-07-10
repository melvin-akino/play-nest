'use client'

import { useEffect, useState } from 'react'

interface AttendanceRow {
  id: string
  timeIn: string
  timeOut: string | null
  status: 'CLOCKED_IN' | 'CLOCKED_OUT'
  user: { name: string; email: string }
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function fmtTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
}

function fmtDuration(timeIn: string, timeOut: string | null) {
  if (!timeOut) return '—'
  const mins = Math.round((new Date(timeOut).getTime() - new Date(timeIn).getTime()) / 60000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function AttendanceViewer() {
  const [date, setDate] = useState(todayStr())
  const [rows, setRows] = useState<AttendanceRow[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    const from = `${date}T00:00:00.000Z`
    const to = `${date}T23:59:59.999Z`
    const res = await fetch(`/api/attendance?from=${from}&to=${to}`)
    const json = await res.json()
    if (json.success) setRows(json.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [date])

  const totalHours = rows.reduce((sum, r) => {
    if (!r.timeOut) return sum
    return sum + (new Date(r.timeOut).getTime() - new Date(r.timeIn).getTime()) / 3600000
  }, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <span className="text-sm text-gray-500">Total hours logged: <span className="font-semibold text-gray-900">{totalHours.toFixed(1)}h</span></span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {loading && <p className="text-gray-400 text-sm p-4">Loading...</p>}
        {!loading && rows.length === 0 && <p className="text-gray-400 text-sm p-4">No attendance records for this date.</p>}
        {rows.map(r => (
          <div key={r.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="font-medium text-gray-900">{r.user.name}</div>
              <div className="text-sm text-gray-500">{r.user.email}</div>
            </div>
            <div className="text-right text-sm">
              <div className="text-gray-900">{fmtTime(r.timeIn)} → {fmtTime(r.timeOut)}</div>
              <div className="text-gray-500">
                {r.status === 'CLOCKED_IN'
                  ? <span className="text-green-600 font-medium">Currently clocked in</span>
                  : fmtDuration(r.timeIn, r.timeOut)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
