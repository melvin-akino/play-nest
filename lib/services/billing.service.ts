import type { Rate } from '@/lib/db/schema'

export interface BillResult {
  durationMinutes: number
  billableMinutes: number
  amountCentavos: number
  amountDisplay: string
}

export function computeBill(timeIn: Date, timeOut: Date, rate: Rate): BillResult {
  const durationMs = timeOut.getTime() - timeIn.getTime()
  const durationMinutes = Math.ceil(durationMs / 60000)
  const billableMinutes = Math.max(durationMinutes, rate.minMinutes)
  const amountCentavos = Math.ceil((billableMinutes / 60) * rate.pricePerHour)
  return {
    durationMinutes,
    billableMinutes,
    amountCentavos,
    amountDisplay: formatCentavos(amountCentavos),
  }
}

export function formatCentavos(centavos: number): string {
  return `₱${(centavos / 100).toFixed(2)}`
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}
