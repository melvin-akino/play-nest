'use client'

import { useEffect, useState } from 'react'

export function ClockInOutButton() {
  const [clockedIn, setClockedIn] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  async function refreshStatus() {
    const res = await fetch('/api/attendance')
    const json = await res.json()
    setClockedIn(!!json.data?.status)
  }

  useEffect(() => { refreshStatus() }, [])

  async function toggle() {
    setLoading(true)
    try {
      await fetch(clockedIn ? '/api/attendance/clock-out' : '/api/attendance/clock-in', { method: 'POST' })
      await refreshStatus()
    } finally {
      setLoading(false)
    }
  }

  if (clockedIn === null) return null

  return (
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
      {clockedIn ? '● Clocked In' : 'Clock In'}
    </button>
  )
}
