import { TransactionsManager } from '@/components/admin/TransactionsManager'

export default function TransactionsPage() {
  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900">Transactions</h1>
      <TransactionsManager />
    </div>
  )
}
