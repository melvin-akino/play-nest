import { listRates } from '@/lib/services/rate.service'
import { RateManager } from '@/components/admin/RateManager'

export default async function RatesPage() {
  const rates = await listRates()
  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900">Pricing Rates</h1>
      <RateManager initialRates={rates} />
    </div>
  )
}
