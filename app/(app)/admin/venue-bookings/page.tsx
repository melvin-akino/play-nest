import { VenueBookingsManager } from '@/components/admin/VenueBookingsManager'
import { VenuePackageManager } from '@/components/admin/VenuePackageManager'

export default function VenueBookingsPage() {
  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900">Venue Rentals</h1>
      <VenuePackageManager />
      <VenueBookingsManager />
    </div>
  )
}
