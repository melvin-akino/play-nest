'use client'

import { useEffect, useState } from 'react'
import { usePrintReceipt } from '@/components/print/Receipt'

interface BillPreview {
  session: {
    id: string
    timeIn: string
    child: { name: string; guardian: { name: string; phone: string } }
  }
  bill: {
    durationMinutes: number
    billableMinutes: number
    amountCentavos: number
    amountDisplay: string
  }
  checkoutTime: string
}

interface Props {
  sessionId: string
  staffName: string
  onClose: () => void
  onCompleted: () => void
}

export function CheckoutModal({ sessionId, staffName, onClose, onCompleted }: Props) {
  const [preview, setPreview] = useState<BillPreview | null>(null)
  const [method, setMethod] = useState<'CASH' | 'GCASH'>('CASH')
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const printReceipt = usePrintReceipt()

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/checkout`)
      .then(r => r.json())
      .then(j => { if (j.success) setPreview(j.data); else setError(j.error) })
      .catch(() => setError('Failed to load bill'))
      .finally(() => setLoading(false))
  }, [sessionId])

  async function confirmPayment() {
    if (!preview) return
    setPaying(true); setError('')
    try {
      const res = await fetch(`/api/sessions/${sessionId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: preview.bill.amountCentavos,
          method,
          checkoutTime: preview.checkoutTime,
          durationMinutes: preview.bill.billableMinutes,
        }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.error); return }

      printReceipt({
        childName: preview.session.child.name,
        guardianName: preview.session.child.guardian.name,
        timeIn: preview.session.timeIn,
        timeOut: preview.checkoutTime,
        durationMinutes: preview.bill.billableMinutes,
        amountCentavos: preview.bill.amountCentavos,
        method,
        staffName,
      })
      onCompleted()
    } catch {
      setError('Payment failed')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Check Out</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}

          {loading && <div className="text-center text-gray-400 py-8">Computing bill...</div>}

          {preview && !loading && (
            <>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Child</span><span className="font-medium">{preview.session.child.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Time In</span><span>{new Date(preview.session.timeIn).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Duration</span>
                  <span>{Math.floor(preview.bill.billableMinutes / 60)}h {preview.bill.billableMinutes % 60}m</span>
                </div>
              </div>

              <div className="text-center">
                <div className="text-4xl font-bold text-green-600">{preview.bill.amountDisplay}</div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Payment Method</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['CASH', 'GCASH'] as const).map(m => (
                    <button key={m} onClick={() => setMethod(m)}
                      className={`py-3 rounded-xl font-semibold text-sm border-2 transition-colors ${method === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={confirmPayment} disabled={paying}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-base">
                {paying ? 'Processing...' : `Confirm ${method} Payment`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
