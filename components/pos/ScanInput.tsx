'use client'

import { useRef, useEffect, useState } from 'react'

interface Props {
  onScan: (code: string) => void
  disabled?: boolean
}

export function ScanInput({ onScan, disabled }: Props) {
  const ref = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')

  // Auto-focus when not disabled
  useEffect(() => {
    if (!disabled) ref.current?.focus()
  }, [disabled])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && value.trim()) {
      onScan(value.trim())
      setValue('')
    }
  }

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      </div>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Scan QR / barcode or type code + Enter"
        className="w-full pl-10 pr-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm focus:outline-none focus:border-blue-400 disabled:opacity-50 bg-gray-50"
      />
    </div>
  )
}
