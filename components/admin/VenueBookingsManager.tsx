'use client'

import { useEffect, useState } from 'react'
import { formatCentavos } from '@/lib/services/billing.service'

interface VenuePackage {
  id: string
  label: string
  pricingType: 'FLAT' | 'HOURLY'
  amount: number
  isActive: boolean
}

interface Booking {
  id: string
  customerName: string
  customerPhone: string
  eventName: string | null
  scheduledStart: string
  scheduledEnd: string
  guestCountEstimate: number | null
  pricingType: 'FLAT' | 'HOURLY'
  totalAmount: number
  exclusive: boolean
  status: 'RESERVED' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  cancelReason: string | null
  notes: string | null
}

interface BookingPayment {
  id: string
  type: 'DEPOSIT' | 'BALANCE' | 'FULL'
  amount: number
  method: 'CASH' | 'GCASH'
  paidAt: string
  voided: boolean
  voidedReason: string | null
  staff: { name: string }
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

const STATUS_COLORS: Record<string, string> = {
  RESERVED: 'bg-gray-100 text-gray-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-500',
  CANCELLED: 'bg-red-100 text-red-700',
}

export function VenueBookingsManager() {
  const [date, setDate] = useState(todayStr())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [packages, setPackages] = useState<VenuePackage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [payments, setPayments] = useState<Record<string, BookingPayment[]>>({})
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  // New booking form state
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [eventName, setEventName] = useState('')
  const [packageId, setPackageId] = useState('')
  const [pricingType, setPricingType] = useState<'FLAT' | 'HOURLY'>('FLAT')
  const [totalAmount, setTotalAmount] = useState('')
  const [scheduledStart, setScheduledStart] = useState('')
  const [scheduledEnd, setScheduledEnd] = useState('')
  const [guestCount, setGuestCount] = useState('')
  const [exclusive, setExclusive] = useState(true)
  const [notes, setNotes] = useState('')

  // New payment form state (per booking)
  const [payAmount, setPayAmount] = useState('')
  const [payType, setPayType] = useState<'DEPOSIT' | 'BALANCE' | 'FULL'>('FULL')
  const [payMethod, setPayMethod] = useState<'CASH' | 'GCASH'>('CASH')

  async function loadBookings() {
    setLoading(true)
    const res = await fetch(`/api/venue-bookings?date=${date}`)
    const json = await res.json()
    if (json.success) setBookings(json.data)
    setLoading(false)
  }

  async function loadPackages() {
    const res = await fetch('/api/venue-packages')
    const json = await res.json()
    if (json.success) setPackages(json.data.filter((p: VenuePackage) => p.isActive))
  }

  useEffect(() => { loadBookings() }, [date])
  useEffect(() => { loadPackages() }, [])

  function selectPackage(id: string) {
    setPackageId(id)
    const pkg = packages.find(p => p.id === id)
    if (pkg) {
      setPricingType(pkg.pricingType)
      setTotalAmount((pkg.amount / 100).toFixed(2))
    }
  }

  async function createBooking() {
    const amountCentavos = Math.round(parseFloat(totalAmount) * 100)
    if (!customerName || !customerPhone || !scheduledStart || !scheduledEnd || isNaN(amountCentavos) || amountCentavos <= 0) return
    setError('')
    const res = await fetch('/api/venue-bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageId: packageId || undefined,
        customerName, customerPhone,
        eventName: eventName || undefined,
        scheduledStart: new Date(scheduledStart).toISOString(),
        scheduledEnd: new Date(scheduledEnd).toISOString(),
        guestCountEstimate: guestCount ? parseInt(guestCount) : undefined,
        pricingType, totalAmount: amountCentavos, exclusive,
        notes: notes || undefined,
      }),
    })
    const json = await res.json()
    if (!json.success) { setError(json.error); return }
    setCustomerName(''); setCustomerPhone(''); setEventName(''); setPackageId('')
    setTotalAmount(''); setScheduledStart(''); setScheduledEnd(''); setGuestCount(''); setNotes('')
    setShowForm(false)
    await loadBookings()
  }

  async function doTransition(id: string, action: 'confirm' | 'checkin' | 'checkout') {
    setError('')
    const res = await fetch(`/api/venue-bookings/${id}/${action}`, { method: 'POST' })
    const json = await res.json()
    if (!json.success) { setError(json.error); return }
    await loadBookings()
  }

  async function confirmCancel(id: string) {
    if (!cancelReason.trim()) return
    setError('')
    const res = await fetch(`/api/venue-bookings/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: cancelReason.trim() }),
    })
    const json = await res.json()
    if (!json.success) { setError(json.error); return }
    setCancellingId(null); setCancelReason('')
    await loadBookings()
  }

  async function loadPayments(bookingId: string) {
    const res = await fetch(`/api/venue-bookings/${bookingId}/payments`)
    const json = await res.json()
    if (json.success) setPayments(prev => ({ ...prev, [bookingId]: json.data }))
  }

  async function toggleExpand(id: string) {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    await loadPayments(id)
  }

  async function recordPayment(bookingId: string) {
    const amountCentavos = Math.round(parseFloat(payAmount) * 100)
    if (isNaN(amountCentavos) || amountCentavos <= 0) return
    setError('')
    const res = await fetch(`/api/venue-bookings/${bookingId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: payType, amount: amountCentavos, method: payMethod }),
    })
    const json = await res.json()
    if (!json.success) { setError(json.error); return }
    setPayAmount('')
    await loadPayments(bookingId)
  }

  function balanceFor(booking: Booking) {
    const rows = payments[booking.id] ?? []
    const paid = rows.filter(p => !p.voided).reduce((s, p) => s + p.amount, 0)
    return booking.totalAmount - paid
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}

      <div className="flex items-center gap-3">
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={() => setShowForm(v => !v)}
          className="ml-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          {showForm ? 'Cancel' : '+ New Booking'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h3 className="font-semibold text-gray-800 text-sm">New Venue Booking</h3>
          <div className="grid grid-cols-2 gap-2">
            <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer name *"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Phone *"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <input value={eventName} onChange={e => setEventName(e.target.value)} placeholder="Event name (optional)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

          {packages.length > 0 && (
            <select value={packageId} onChange={e => selectPackage(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Custom (no package)</option>
              {packages.map(p => <option key={p.id} value={p.id}>{p.label} — {formatCentavos(p.amount)}{p.pricingType === 'HOURLY' ? '/hr' : ''}</option>)}
            </select>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Pricing Type</label>
              <select value={pricingType} onChange={e => setPricingType(e.target.value as 'FLAT' | 'HOURLY')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="FLAT">Flat Total</option>
                <option value="HOURLY">Hourly Rate</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Total Amount (₱)</label>
              <input value={totalAmount} onChange={e => setTotalAmount(e.target.value)} type="number" step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Scheduled Start</label>
              <input value={scheduledStart} onChange={e => setScheduledStart(e.target.value)} type="datetime-local"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Scheduled End</label>
              <input value={scheduledEnd} onChange={e => setScheduledEnd(e.target.value)} type="datetime-local"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 items-end">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Guest Count (optional)</label>
              <input value={guestCount} onChange={e => setGuestCount(e.target.value)} type="number" min="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
              <input type="checkbox" checked={exclusive} onChange={e => setExclusive(e.target.checked)} />
              Exclusive (blocks walk-ins, shown as Front Desk warning)
            </label>
          </div>

          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

          <button onClick={createBooking}
            disabled={!customerName || !customerPhone || !scheduledStart || !scheduledEnd || !totalAmount}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg">
            Create Booking
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {loading && <p className="text-gray-400 text-sm p-4">Loading...</p>}
        {!loading && bookings.length === 0 && <p className="text-gray-400 text-sm p-4">No bookings for this date.</p>}
        {bookings.map(b => (
          <div key={b.id} className="px-4 py-3">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(b.id)}>
              <div>
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  {b.customerName}
                  {b.eventName && <span className="text-gray-500 font-normal">— {b.eventName}</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status]}`}>{b.status}</span>
                  {b.exclusive && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">Exclusive</span>}
                </div>
                <div className="text-sm text-gray-500">
                  {b.customerPhone} · {new Date(b.scheduledStart).toLocaleString('en-PH', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                  {' – '}{new Date(b.scheduledEnd).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                  {b.guestCountEstimate && ` · ~${b.guestCountEstimate} guests`}
                </div>
                {b.status === 'CANCELLED' && b.cancelReason && (
                  <div className="text-xs text-red-500 mt-1">Cancelled: {b.cancelReason}</div>
                )}
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{formatCentavos(b.totalAmount)}</div>
                <div className="text-xs text-gray-400">{b.pricingType === 'HOURLY' ? 'hourly' : 'flat'}</div>
              </div>
            </div>

            {expandedId === b.id && (
              <div className="mt-3 space-y-3 border-t pt-3">
                <div className="flex gap-2 flex-wrap">
                  {b.status === 'RESERVED' && (
                    <button onClick={() => doTransition(b.id, 'confirm')} className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded-lg font-medium">Confirm</button>
                  )}
                  {(b.status === 'RESERVED' || b.status === 'CONFIRMED') && (
                    <button onClick={() => doTransition(b.id, 'checkin')} className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg font-medium">Check In</button>
                  )}
                  {b.status === 'ACTIVE' && (
                    <button onClick={() => doTransition(b.id, 'checkout')} className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium">Check Out</button>
                  )}
                  {(b.status === 'RESERVED' || b.status === 'CONFIRMED' || b.status === 'ACTIVE') && (
                    <button onClick={() => { setCancellingId(b.id); setCancelReason('') }} className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-lg font-medium">Cancel Booking</button>
                  )}
                </div>

                {cancellingId === b.id && (
                  <div className="bg-red-50 rounded-lg p-3 space-y-2">
                    <label className="text-xs font-medium text-gray-700 block">Reason for cancelling</label>
                    <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                    <div className="flex gap-2">
                      <button onClick={() => confirmCancel(b.id)} disabled={!cancelReason.trim()}
                        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold px-3 py-1.5 rounded-lg">Confirm Cancel</button>
                      <button onClick={() => setCancellingId(null)} className="text-sm text-gray-500 hover:underline px-3 py-1.5">Back</button>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Balance Due</span>
                    <span className="font-semibold text-gray-900">{formatCentavos(balanceFor(b))}</span>
                  </div>
                  {(payments[b.id] ?? []).map(p => (
                    <div key={p.id} className="flex justify-between text-xs text-gray-500">
                      <span className={p.voided ? 'line-through' : ''}>{p.type} · {p.method} · by {p.staff.name}</span>
                      <span className={p.voided ? 'line-through text-gray-400' : 'text-gray-700'}>{formatCentavos(p.amount)}</span>
                    </div>
                  ))}
                  {b.status !== 'CANCELLED' && balanceFor(b) > 0 && (
                    <div className="flex gap-2 pt-2">
                      <select value={payType} onChange={e => setPayType(e.target.value as 'DEPOSIT' | 'BALANCE' | 'FULL')}
                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="FULL">Full</option>
                        <option value="DEPOSIT">Deposit</option>
                        <option value="BALANCE">Balance</option>
                      </select>
                      <input value={payAmount} onChange={e => setPayAmount(e.target.value)} type="number" step="0.01" placeholder="Amount"
                        className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <select value={payMethod} onChange={e => setPayMethod(e.target.value as 'CASH' | 'GCASH')}
                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="CASH">Cash</option>
                        <option value="GCASH">GCash</option>
                      </select>
                      <button onClick={() => recordPayment(b.id)} disabled={!payAmount}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                        Record
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
