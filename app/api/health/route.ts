import { db } from '@/lib/db/client'
import { sql } from 'drizzle-orm'

export async function GET() {
  try {
    await db.run(sql`SELECT 1`)
    return Response.json({ status: 'ok' })
  } catch {
    return Response.json({ status: 'error' }, { status: 500 })
  }
}
