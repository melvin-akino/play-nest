'use client'

import { useEffect, useState } from 'react'

interface DailyRow {
  date: string
  sessionCount: number
  totalRevenueDisplay: string
  totalRevenueCentavos: number
}

interface HourBucket {
  hour: number
  count: number
}

interface MonthlyData {
  year: number
  month: number
  daily: DailyRow[]
  peaks: HourBucket[]
}

interface TopItem {
  itemId: string
  name: string
  quantitySold: number
  revenueCentavos: number
}

interface DailySummary {
  sessionCount: number
  totalRevenueDisplay: string
  itemSalesRevenueDisplay: string
  venueRevenueDisplay: string
  combinedRevenueDisplay: string
  topItems: TopItem[]
}

function exportCSV(rows: DailyRow[], year: number, month: number) {
  const header = 'Date,Sessions,Revenue (₱)\n'
  const body = rows.map(r => `${r.date},${r.sessionCount},${(r.totalRevenueCentavos / 100).toFixed(2)}`).join('\n')
  const blob = new Blob([header + body], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `playnest-${year}-${String(month).padStart(2, '0')}.csv`
  a.click()
}

export function ReportsClient() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState<MonthlyData | null>(null)
  const [today, setToday] = useState<DailySummary | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/reports/monthly?year=${year}&month=${month}`)
      .then(r => r.json())
      .then(j => { if (j.success) setData(j.data) })
      .finally(() => setLoading(false))
  }, [year, month])

  useEffect(() => {
    const todayDate = new Date().toISOString().split('T')[0]
    fetch(`/api/reports/daily?date=${todayDate}`)
      .then(r => r.json())
      .then(j => { if (j.success) setToday(j.data) })
  }, [])

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const totalRevenue = data?.daily.reduce((s, r) => s + r.totalRevenueCentavos, 0) ?? 0
  const totalSessions = data?.daily.reduce((s, r) => s + r.sessionCount, 0) ?? 0
  const maxPeak = Math.max(...(data?.peaks.map(p => p.count) ?? [1]))

  return (
    <div className="space-y-6">
      {/* Today's sales */}
      {today && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Today&apos;s Sales</h3>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Playtime</p>
              <p className="text-xl font-bold text-gray-900">{today.totalRevenueDisplay}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Shop Items</p>
              <p className="text-xl font-bold text-gray-900">{today.itemSalesRevenueDisplay}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Venue Rentals</p>
              <p className="text-xl font-bold text-gray-900">{today.venueRevenueDisplay}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Combined Total</p>
              <p className="text-xl font-bold text-green-700">{today.combinedRevenueDisplay}</p>
            </div>
          </div>
          {today.topItems.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Top Selling Items</p>
              <div className="space-y-1">
                {today.topItems.map(item => (
                  <div key={item.itemId} className="flex justify-between text-sm">
                    <span className="text-gray-700">{item.name} × {item.quantitySold}</span>
                    <span className="font-medium text-gray-900">₱{(item.revenueCentavos / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3">
        <select value={month} onChange={e => setMonth(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {[now.getFullYear(), now.getFullYear() - 1].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {data && (
          <button onClick={() => exportCSV(data.daily, year, month)}
            className="ml-auto text-sm bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg font-medium">
            Export CSV
          </button>
        )}
      </div>

      {loading && <div className="text-gray-400 text-sm">Loading...</div>}

      {data && !loading && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₱{(totalRevenue / 100).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{totalSessions}</p>
            </div>
          </div>

          {/* Daily table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Date', 'Sessions', 'Revenue'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.daily.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No data for this period</td></tr>
                )}
                {data.daily.map(r => (
                  <tr key={r.date} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{r.date}</td>
                    <td className="px-4 py-3 text-gray-600">{r.sessionCount}</td>
                    <td className="px-4 py-3 font-semibold text-green-700">{r.totalRevenueDisplay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Peak hours */}
          {data.peaks.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Peak Hours</h3>
              <div className="flex items-end gap-1 h-24">
                {Array.from({ length: 24 }, (_, i) => {
                  const bucket = data.peaks.find(p => p.hour === i)
                  const count = bucket?.count ?? 0
                  const height = maxPeak > 0 ? (count / maxPeak) * 100 : 0
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-blue-500 rounded-t" style={{ height: `${height}%`, minHeight: count > 0 ? 4 : 0 }} title={`${i}:00 — ${count}`} />
                      {i % 3 === 0 && <span className="text-xs text-gray-400">{i}</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
