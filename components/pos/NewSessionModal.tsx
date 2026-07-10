'use client'

import { useState } from 'react'
import { usePrintTicket } from '@/components/print/Ticket'
import { ScanInput } from './ScanInput'

type Step = 'phone' | 'guardian' | 'child' | 'qr' | 'confirm'

interface Guardian {
  id: string
  name: string
  phone: string
  children: Child[]
}

interface Child {
  id: string
  name: string
  birthdate?: string | null
}

interface Props {
  onClose: () => void
  onCreated: () => void
}

export function NewSessionModal({ onClose, onCreated }: Props) {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [guardian, setGuardian] = useState<Guardian | null>(null)
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [qrCode, setQrCode] = useState('')
  const [qrError, setQrError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // New guardian form
  const [newGuardianName, setNewGuardianName] = useState('')
  const [newGuardianAddress, setNewGuardianAddress] = useState('')
  const [newChildName, setNewChildName] = useState('')
  const [newChildBirthdate, setNewChildBirthdate] = useState('')
  const [addingChild, setAddingChild] = useState(false)
  const [newChildGender, setNewChildGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | ''>('')

  const printTicket = usePrintTicket()

  async function lookupPhone() {
    if (!phone.trim()) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/customers?phone=${encodeURIComponent(phone.trim())}`)
      const json = await res.json()
      if (json.data) {
        setGuardian(json.data)
        setStep('child')
      } else {
        setStep('guardian')
      }
    } catch {
      setError('Lookup failed')
    } finally {
      setLoading(false)
    }
  }

  async function createGuardian() {
    if (!newGuardianName.trim()) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGuardianName.trim(), phone: phone.trim(), address: newGuardianAddress.trim() || undefined }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.error); return }
      setGuardian({ ...json.data, children: [] })
      setStep('child')
    } catch {
      setError('Failed to save guardian')
    } finally {
      setLoading(false)
    }
  }

  async function saveNewChild() {
    if (!newChildName.trim() || !guardian) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/customers/${guardian.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newChildName.trim(),
          birthdate: newChildBirthdate || undefined,
          gender: newChildGender || undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.error); return }
      const child = json.data as Child
      setGuardian(prev => prev ? { ...prev, children: [...prev.children, child] } : prev)
      setSelectedChild(child)
      setAddingChild(false)
      setNewChildName(''); setNewChildBirthdate(''); setNewChildGender('')
    } catch {
      setError('Failed to save child')
    } finally {
      setLoading(false)
    }
  }

  async function startSession() {
    if (!selectedChild || !qrCode) return
    setLoading(true); setQrError('')
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: selectedChild.id, qrCode }),
      })
      const json = await res.json()
      if (!json.success) { setQrError(json.error); return }

      printTicket({
        childName: selectedChild.name,
        guardianName: guardian!.name,
        timeIn: json.data.session.timeIn,
        qrCode: json.data.qrCode,
        rateName: 'Standard Rate',
      })
      onCreated()
    } catch {
      setQrError('Failed to start session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">New Session</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}

          {step === 'phone' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Guardian Phone Number</label>
              <input
                autoFocus
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && lookupPhone()}
                placeholder="09XXXXXXXXX"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={lookupPhone} disabled={loading || !phone.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg">
                {loading ? 'Looking up...' : 'Continue'}
              </button>
            </div>
          )}

          {step === 'guardian' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">No account found for <strong>{phone}</strong>. Register guardian:</p>
              <input value={newGuardianName} onChange={e => setNewGuardianName(e.target.value)}
                placeholder="Full Name *" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={newGuardianAddress} onChange={e => setNewGuardianAddress(e.target.value)}
                placeholder="Address (optional)" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={createGuardian} disabled={loading || !newGuardianName.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg">
                {loading ? 'Saving...' : 'Save Guardian'}
              </button>
            </div>
          )}

          {step === 'child' && guardian && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Guardian: <strong>{guardian.name}</strong> · {guardian.phone}</p>
              <p className="text-sm text-gray-500">Select a child:</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {guardian.children.map(c => (
                  <button key={c.id} onClick={() => setSelectedChild(c)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border-2 transition-colors text-sm ${selectedChild?.id === c.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                    {c.name} {c.birthdate && <span className="text-gray-400">· {c.birthdate}</span>}
                  </button>
                ))}
              </div>

              {!addingChild ? (
                <button onClick={() => setAddingChild(true)} className="text-sm text-blue-600 hover:underline">+ Add new child</button>
              ) : (
                <div className="space-y-2 border border-gray-200 rounded-lg p-3">
                  <input value={newChildName} onChange={e => setNewChildName(e.target.value)}
                    placeholder="Child's Name *" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  <input value={newChildBirthdate} onChange={e => setNewChildBirthdate(e.target.value)}
                    type="date" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  <select value={newChildGender} onChange={e => setNewChildGender(e.target.value as 'MALE' | 'FEMALE' | 'OTHER' | '')}
                    className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
                    <option value="">Gender (optional)</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <div className="flex gap-2">
                    <button onClick={saveNewChild} disabled={loading || !newChildName.trim()}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold py-1.5 rounded">Save</button>
                    <button onClick={() => setAddingChild(false)} className="flex-1 border text-sm py-1.5 rounded text-gray-600 hover:bg-gray-50">Cancel</button>
                  </div>
                </div>
              )}

              <button onClick={() => setStep('qr')} disabled={!selectedChild}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg mt-2">
                Continue{selectedChild ? ` with ${selectedChild.name}` : ''}
              </button>
            </div>
          )}

          {step === 'qr' && selectedChild && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Scan or enter the QR sticker to assign to <strong>{selectedChild.name}</strong>:
              </p>
              <ScanInput
                disabled={loading}
                onScan={(code) => {
                  setQrError('')
                  setQrCode(code)
                }}
              />
              {qrCode && (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                  <span className="font-mono font-medium text-gray-900">{qrCode}</span>
                  <button onClick={() => setQrCode('')} className="text-red-500 hover:text-red-700 text-xs">Clear</button>
                </div>
              )}
              {qrError && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{qrError}</div>}

              <button onClick={startSession} disabled={loading || !qrCode}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg mt-2">
                {loading ? 'Starting...' : 'Start Session'}
              </button>
              <button onClick={() => setStep('child')} className="w-full text-sm text-gray-500 hover:underline">
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
