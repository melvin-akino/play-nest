import { auth } from '@/lib/config/auth'
import { PosBoard } from '@/components/pos/PosBoard'

export default async function PosPage() {
  const session = await auth()

  return (
    <div className="h-[calc(100vh-65px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Front Desk</h1>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      <PosBoard staffName={session!.user.name!} staffRole={session!.user.role} />
    </div>
  )
}
