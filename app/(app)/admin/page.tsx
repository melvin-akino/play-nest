import { getDailySummary } from '@/lib/services/report.service'
import { getActiveSessions } from '@/lib/services/session.service'
import { formatCentavos } from '@/lib/services/billing.service'

export default async function AdminDashboard() {
  const today = new Date().toISOString().split('T')[0]
  const [summary, active] = await Promise.all([
    getDailySummary(today),
    getActiveSessions(),
  ])

  const cards = [
    { label: "Today's Revenue", value: summary.totalRevenueDisplay, sub: `${summary.sessionCount} sessions` },
    { label: 'Active Now', value: String(active.length), sub: 'children inside' },
    { label: 'Avg Duration', value: summary.avgDurationMinutes > 0 ? `${summary.avgDurationMinutes}m` : '—', sub: 'per session today' },
    { label: 'Cash', value: formatCentavos(summary.cashTotal), sub: `GCash: ${formatCentavos(summary.gcashTotal)}` },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">{c.label}</p>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
