import { AuditLogViewer } from '@/components/admin/AuditLogViewer'

export default function AuditLogsPage() {
  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900">Audit Logs</h1>
      <AuditLogViewer />
    </div>
  )
}
