import { AttendanceViewer } from '@/components/admin/AttendanceViewer'
import { BiometricEnrollmentManager } from '@/components/admin/BiometricEnrollmentManager'

export default function AttendancePage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-gray-900">Staff Attendance</h1>
        <AttendanceViewer />
      </div>
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Biometric Devices</h2>
        <BiometricEnrollmentManager />
      </div>
    </div>
  )
}
