'use client'

import { useEffect, useState } from 'react'
import { startRegistration, browserSupportsWebAuthn } from '@simplewebauthn/browser'

interface StaffUser {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

interface Credential {
  id: string
  deviceLabel: string | null
  createdAt: string
}

export function BiometricEnrollmentManager() {
  const [staff, setStaff] = useState<StaffUser[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<Record<string, Credential[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/staff').then(r => r.json()).then(j => { if (j.success) setStaff(j.data) })
  }, [])

  async function loadCredentials(userId: string) {
    const res = await fetch(`/api/webauthn/credentials?userId=${userId}`)
    const json = await res.json()
    if (json.success) setCredentials(prev => ({ ...prev, [userId]: json.data }))
  }

  async function toggleExpand(userId: string) {
    if (expandedId === userId) { setExpandedId(null); return }
    setExpandedId(userId)
    await loadCredentials(userId)
  }

  async function enrollFor(userId: string, userName: string) {
    setError(''); setLoading(true)
    try {
      const optionsRes = await fetch('/api/webauthn/register-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId }),
      })
      const optionsJson = await optionsRes.json()
      if (!optionsJson.success) { setError(optionsJson.error); return }

      const response = await startRegistration({ optionsJSON: optionsJson.data })

      const verifyRes = await fetch('/api/webauthn/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId, response, deviceLabel: `Enrolled by admin for ${userName}` }),
      })
      const verifyJson = await verifyRes.json()
      if (!verifyJson.success) { setError(verifyJson.error); return }
      await loadCredentials(userId)
    } catch {
      setError('Enrollment was cancelled or failed — make sure this device has a fingerprint reader, Face/Windows Hello set up, and the staff member completes the prompt')
    } finally {
      setLoading(false)
    }
  }

  async function revoke(credentialId: string, userId: string) {
    await fetch(`/api/webauthn/credentials/${credentialId}`, { method: 'DELETE' })
    await loadCredentials(userId)
  }

  if (!browserSupportsWebAuthn()) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-2 rounded-lg">
        This browser doesn&apos;t support biometric (WebAuthn) enrollment.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {staff.map(s => (
          <div key={s.id} className="px-4 py-3">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(s.id)}>
              <div>
                <div className="font-medium text-gray-900">{s.name}</div>
                <div className="text-sm text-gray-500">{s.email}</div>
              </div>
              <span className="text-xs text-gray-400">{expandedId === s.id ? '▲' : '▼'}</span>
            </div>

            {expandedId === s.id && (
              <div className="mt-3 space-y-2 border-t pt-3">
                {(credentials[s.id] ?? []).length === 0 && (
                  <p className="text-xs text-gray-400">No enrolled biometric devices yet.</p>
                )}
                {(credentials[s.id] ?? []).map(c => (
                  <div key={c.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-gray-700">{c.deviceLabel ?? 'Unnamed device'}</span>
                    <button onClick={() => revoke(c.id, s.id)} className="text-xs text-red-500 hover:text-red-700">Revoke</button>
                  </div>
                ))}
                <button
                  onClick={() => enrollFor(s.id, s.name)}
                  disabled={loading}
                  className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-3 py-1.5 rounded-lg"
                >
                  + Enroll Device (staff must be present to scan)
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
