'use client'

import { useEffect, useState } from 'react'
import { formatDuration } from '@/lib/services/billing.service'

interface Props {
  sessionId: string
  childName: string
  guardianName: string
  guardianPhone: string
  timeIn: string
  onCheckout: (sessionId: string) => void
}

export function SessionCard({ sessionId, childName, guardianName, guardianPhone, timeIn, onCheckout }: Props) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = new Date(timeIn).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 60000))
    tick()
    const id = setInterval(tick, 10000)
    return () => clearInterval(id)
  }, [timeIn])

  const hours = Math.floor(elapsed / 60)
  const mins = elapsed % 60
  const isLong = elapsed >= 120

  return (
    <div className={`rounded-xl border-2 p-4 bg-white shadow-sm flex flex-col gap-2 ${isLong ? 'border-orange-400' : 'border-blue-200'}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="font-bold text-gray-900 text-base">{childName}</div>
          <div className="text-xs text-gray-500">{guardianName} · {guardianPhone}</div>
        </div>
        {isLong && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Long</span>}
      </div>
      <div className="text-3xl font-mono font-bold text-blue-600 text-center py-1">
        {hours > 0 ? `${hours}:${String(mins).padStart(2, '0')}` : `${mins}m`}
      </div>
      <div className="text-xs text-gray-400 text-center">
        In: {new Date(timeIn).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <button
        onClick={() => onCheckout(sessionId)}
        className="mt-1 w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
      >
        Check Out
      </button>
    </div>
  )
}
