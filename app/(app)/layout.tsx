import { auth } from '@/lib/config/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SignOutButton } from '@/components/shared/SignOutButton'
import { ClockInOutButton } from '@/components/shared/ClockInOutButton'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  const isAdmin = session.user.role === 'ADMIN'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Jungle Gym Play House" className="h-10 w-auto object-contain" />
        </div>
        <nav className="flex items-center gap-1 flex-1">
          <Link href="/pos" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
            Front Desk
          </Link>
          {isAdmin && (
            <>
              <Link href="/admin" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/admin/reports" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                Reports
              </Link>
              <Link href="/admin/transactions" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                Transactions
              </Link>
              <Link href="/admin/customers" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                Customers
              </Link>
              <Link href="/admin/rates" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                Rates
              </Link>
              <Link href="/admin/staff" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                Staff
              </Link>
              <Link href="/admin/attendance" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                Attendance
              </Link>
              <Link href="/admin/inventory" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                Inventory
              </Link>
              <Link href="/admin/qr-codes" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                QR Codes
              </Link>
              <Link href="/admin/audit-logs" className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                Audit Logs
              </Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <ClockInOutButton />
          <span className="text-gray-500">{session.user.name}</span>
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{session.user.role}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
