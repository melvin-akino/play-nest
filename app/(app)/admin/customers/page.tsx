import { listGuardians } from '@/lib/services/customer.service'

export default async function CustomersPage() {
  const guardians = await listGuardians()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Customer Records</h1>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Guardian', 'Phone', 'Address', 'Children', 'Registered'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {guardians.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No customers yet</td></tr>
            )}
            {guardians.map(g => (
              <tr key={g.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{g.name}</td>
                <td className="px-4 py-3 text-gray-600">{g.phone}</td>
                <td className="px-4 py-3 text-gray-500">{g.address ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {g.children.map(c => (
                      <span key={c.id} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{c.name}</span>
                    ))}
                    {g.children.length === 0 && <span className="text-gray-400">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400">{g.createdAt ? new Date(g.createdAt).toLocaleDateString('en-PH') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
