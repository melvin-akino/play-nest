'use client'

import { useState } from 'react'

interface StaffUser {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

interface Props {
  initialStaff: StaffUser[]
}

export function StaffManager({ initialStaff }: Props) {
  const [staff, setStaff] = useState(initialStaff)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'CASHIER' | 'ADMIN'>('CASHIER')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function reload() {
    const res = await fetch('/api/staff')
    const json = await res.json()
    if (json.success) setStaff(json.data)
  }

  async function createStaff() {
    if (!name || !email || !password) return
    setLoading(true); setError('')
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    })
    const json = await res.json()
    if (!json.success) { setError(json.error); setLoading(false); return }
    setName(''); setEmail(''); setPassword(''); setRole('CASHIER')
    await reload()
    setLoading(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch('/api/staff', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !current }),
    })
    await reload()
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {staff.map(s => (
          <div key={s.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="font-medium text-gray-900 flex items-center gap-2">
                {s.name}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {s.role}
                </span>
                {!s.isActive && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactive</span>}
              </div>
              <div className="text-sm text-gray-500">{s.email}</div>
            </div>
            <button onClick={() => toggleActive(s.id, s.isActive)}
              className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 px-2 py-1 rounded-lg">
              {s.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h3 className="font-semibold text-gray-800 text-sm">Add Staff</h3>
        <div className="grid grid-cols-2 gap-2">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password (min 8)"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={role} onChange={e => setRole(e.target.value as 'CASHIER' | 'ADMIN')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="CASHIER">Cashier</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <button onClick={createStaff} disabled={loading || !name || !email || !password}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          {loading ? 'Saving...' : 'Add Staff'}
        </button>
      </div>
    </div>
  )
}
