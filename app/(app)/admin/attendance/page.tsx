import { AttendanceViewer } from '@/components/admin/AttendanceViewer'

export default function AttendancePage() {
  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900">Staff Attendance</h1>
      <AttendanceViewer />
    </div>
  )
}
