import { StaffManager } from '@/components/admin/StaffManager'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'

export default async function StaffPage() {
  const staff = await db.query.users.findMany({
    orderBy: (u, { asc }) => [asc(u.name)],
    columns: { passwordHash: false },
  })

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900">Staff Management</h1>
      <StaffManager initialStaff={staff} />
    </div>
  )
}
