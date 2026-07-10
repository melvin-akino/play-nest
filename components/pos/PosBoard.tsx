'use client'

import { useCallback, useEffect, useState } from 'react'
import { SessionCard } from './SessionCard'
import { NewSessionModal } from './NewSessionModal'
import { CheckoutModal } from './CheckoutModal'
import { ScanInput } from './ScanInput'
import { ShopModal } from './ShopModal'

interface ActiveSession {
  id: string
  timeIn: string
  child: {
    name: string
    guardian: { name: string; phone: string }
  }
}

interface Props {
  staffName: string
  staffRole: string
}

export function PosBoard({ staffName, staffRole }: Props) {
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [showNewSession, setShowNewSession] = useState(false)
  const [checkoutId, setCheckoutId] = useState<string | null>(null)
  const [showShop, setShowShop] = useState(false)
  const [scanError, setScanError] = useState('')

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions/active')
      const json = await res.json()
      if (json.success) setSessions(json.data)
    } catch { /* silent — UI shows stale data */ }
  }, [])

  useEffect(() => {
    loadSessions()
    const id = setInterval(loadSessions, 30000)
    return () => clearInterval(id)
  }, [loadSessions])

  async function handleScan(code: string) {
    setScanError('')
    const res = await fetch(`/api/qr/${encodeURIComponent(code)}`)
    const json = await res.json()
    if (!json.success) { setScanError('QR code not found or invalid'); return }
    if (json.data.status !== 'ACTIVE') { setScanError(`Session is ${json.data.status.toLowerCase()}`); return }
    setCheckoutId(json.data.id)
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Action bar */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowNewSession(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-sm transition-colors"
        >
          <span className="text-xl leading-none">+</span> New Session
        </button>
        <button
          onClick={() => setShowShop(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-sm transition-colors"
        >
          Shop
        </button>
        <div className="flex-1">
          <ScanInput onScan={handleScan} disabled={!!checkoutId || showNewSession} />
          {scanError && <p className="text-xs text-red-600 mt-1 pl-1">{scanError}</p>}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="font-semibold text-gray-800 text-base">{sessions.length} Active</span>
        {sessions.length > 0 && <span>·</span>}
        {sessions.length > 0 && (
          <span>Oldest: {new Date(sessions[0].timeIn).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</span>
        )}
      </div>

      {/* Session grid */}
      {sessions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
          <svg className="w-16 h-16 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium">No active sessions</p>
          <p className="text-sm">Click <strong>New Session</strong> to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 overflow-y-auto">
          {sessions.map(s => (
            <SessionCard
              key={s.id}
              sessionId={s.id}
              childName={s.child.name}
              guardianName={s.child.guardian.name}
              guardianPhone={s.child.guardian.phone}
              timeIn={s.timeIn}
              onCheckout={setCheckoutId}
            />
          ))}
        </div>
      )}

      {showNewSession && (
        <NewSessionModal
          onClose={() => setShowNewSession(false)}
          onCreated={() => { setShowNewSession(false); loadSessions() }}
        />
      )}

      {checkoutId && (
        <CheckoutModal
          sessionId={checkoutId}
          staffName={staffName}
          onClose={() => { setCheckoutId(null); setScanError('') }}
          onCompleted={() => { setCheckoutId(null); loadSessions() }}
        />
      )}

      {showShop && (
        <ShopModal
          onClose={() => setShowShop(false)}
          onCompleted={() => setShowShop(false)}
        />
      )}
    </div>
  )
}
