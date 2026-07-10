'use client'

import { useEffect, useState } from 'react'
import { startRegistration, startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser'

export function ClockInOutButton() {
  const [clockedIn, setClockedIn] = useState<boolean | null>(null)
  const [hasCredential, setHasCredential] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function refreshStatus() {
    const res = await fetch('/api/attendance')
    const json = await res.json()
    setClockedIn(!!json.data?.status)
  }

  async function refreshCredentials() {
    const res = await fetch('/api/webauthn/credentials')
    const json = await res.json()
    setHasCredential(json.success && json.data.length > 0)
  }

  useEffect(() => { refreshStatus(); refreshCredentials() }, [])

  async function enroll() {
    setError(''); setLoading(true)
    try {
      const optionsRes = await fetch('/api/webauthn/register-options', { method: 'POST' })
      const optionsJson = await optionsRes.json()
      if (!optionsJson.success) { setError(optionsJson.error); return }

      const response = await startRegistration({ optionsJSON: optionsJson.data })

      const verifyRes = await fetch('/api/webauthn/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response, deviceLabel: navigator.userAgent.slice(0, 60) }),
      })
      const verifyJson = await verifyRes.json()
      if (!verifyJson.success) { setError(verifyJson.error); return }
      await refreshCredentials()
    } catch {
      setError('Enrollment was cancelled or failed')
    } finally {
      setLoading(false)
    }
  }

  async function toggle() {
    setError(''); setLoading(true)
    try {
      const endpoint = clockedIn ? '/api/attendance/clock-out' : '/api/attendance/clock-in'
      let webauthnResponse: unknown = undefined

      if (hasCredential) {
        const optionsRes = await fetch('/api/webauthn/auth-options', { method: 'POST' })
        const optionsJson = await optionsRes.json()
        if (!optionsJson.success) { setError(optionsJson.error); return }
        webauthnResponse = await startAuthentication({ optionsJSON: optionsJson.data })
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webauthnResponse }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.error); return }
      await refreshStatus()
    } catch {
      setError('Biometric check was cancelled or failed')
    } finally {
      setLoading(false)
    }
  }

  if (clockedIn === null) return null

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        onClick={toggle}
        disabled={loading}
        className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 ${
          clockedIn
            ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title={clockedIn ? 'Click to clock out' : 'Click to clock in'}
      >
        {hasCredential ? '🔒 ' : ''}{clockedIn ? '● Clocked In' : 'Clock In'}
      </button>
      {hasCredential === false && browserSupportsWebAuthn() && (
        <button
          onClick={enroll}
          disabled={loading}
          className="text-xs text-blue-600 hover:underline disabled:opacity-50"
          title="Enroll your fingerprint or face for faster, verified clock-ins"
        >
          Enroll biometric
        </button>
      )}
    </div>
  )
}
