import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { getExclusiveBookingsToday } from '@/lib/services/venueBooking.service'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)
    return ok(await getExclusiveBookingsToday())
  } catch (e) {
    return serverErr(e)
  }
}
