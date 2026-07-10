'use client'

import { useEffect, useState } from 'react'

interface ExclusiveBooking {
  id: string
  customerName: string
  eventName: string | null
  scheduledStart: string
  scheduledEnd: string
}

export function VenueBanner() {
  const [bookings, setBookings] = useState<ExclusiveBooking[]>([])

  useEffect(() => {
    fetch('/api/venue-bookings/active-today')
      .then(r => r.json())
      .then(j => { if (j.success) setBookings(j.data) })
  }, [])

  if (bookings.length === 0) return null

  return (
    <div className="space-y-1">
      {bookings.map(b => (
        <div key={b.id} className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-2 rounded-lg flex items-center gap-2">
          <span>⚠️</span>
          <span>
            Venue exclusively booked{' '}
            {new Date(b.scheduledStart).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
            {' – '}
            {new Date(b.scheduledEnd).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
            {' '}for <strong>{b.eventName ?? b.customerName}</strong> — no walk-ins during this window.
          </span>
        </div>
      ))}
    </div>
  )
}
