import { redirect } from 'next/navigation'
import { auth } from '@/lib/config/auth'

export default async function Home() {
  const session = await auth()
  redirect(session ? '/pos' : '/login')
}
