import { db } from '@/lib/db/client'
import { sessions, payments } from '@/lib/db/schema'
import { eq, and, sql, gte, lte } from 'drizzle-orm'

export interface DailySummary {
  date: string
  sessionCount: number
  totalRevenueCentavos: number
  totalRevenueDisplay: string
  avgDurationMinutes: number
  cashTotal: number
  gcashTotal: number
}

export interface HourlyBucket {
  hour: number
  count: number
}

export async function getDailySummary(date: string): Promise<DailySummary> {
  // date format: 'YYYY-MM-DD'
  const start = new Date(`${date}T00:00:00.000Z`)
  const end = new Date(`${date}T23:59:59.999Z`)

  const rows = await db
    .select({
      sessionCount: sql<number>`count(${sessions.id})`,
      totalRevenue: sql<number>`coalesce(sum(${payments.amount}), 0)`,
      avgDuration: sql<number>`coalesce(avg(${sessions.durationMinutes}), 0)`,
      cashTotal: sql<number>`coalesce(sum(case when ${payments.method} = 'CASH' then ${payments.amount} else 0 end), 0)`,
      gcashTotal: sql<number>`coalesce(sum(case when ${payments.method} = 'GCASH' then ${payments.amount} else 0 end), 0)`,
    })
    .from(sessions)
    .leftJoin(payments, eq(payments.sessionId, sessions.id))
    .where(
      and(
        eq(sessions.status, 'COMPLETED'),
        gte(sessions.timeIn, start),
        lte(sessions.timeIn, end),
      ),
    )

  const row = rows[0]
  const total = Number(row?.totalRevenue ?? 0)
  return {
    date,
    sessionCount: Number(row?.sessionCount ?? 0),
    totalRevenueCentavos: total,
    totalRevenueDisplay: `₱${(total / 100).toFixed(2)}`,
    avgDurationMinutes: Math.round(Number(row?.avgDuration ?? 0)),
    cashTotal: Number(row?.cashTotal ?? 0),
    gcashTotal: Number(row?.gcashTotal ?? 0),
  }
}

export async function getMonthlySummary(year: number, month: number) {
  // month: 1-12
  const pad = (n: number) => String(n).padStart(2, '0')
  const start = new Date(`${year}-${pad(month)}-01T00:00:00.000Z`)
  const endMonth = month === 12 ? 1 : month + 1
  const endYear = month === 12 ? year + 1 : year
  const end = new Date(`${endYear}-${pad(endMonth)}-01T00:00:00.000Z`)

  const rows = await db
    .select({
      date: sql<string>`date(${sessions.timeIn} / 1000, 'unixepoch')`,
      sessionCount: sql<number>`count(${sessions.id})`,
      totalRevenue: sql<number>`coalesce(sum(${payments.amount}), 0)`,
    })
    .from(sessions)
    .leftJoin(payments, eq(payments.sessionId, sessions.id))
    .where(
      and(
        eq(sessions.status, 'COMPLETED'),
        gte(sessions.timeIn, start),
        lte(sessions.timeIn, end),
      ),
    )
    .groupBy(sql`date(${sessions.timeIn} / 1000, 'unixepoch')`)
    .orderBy(sql`date(${sessions.timeIn} / 1000, 'unixepoch')`)

  return rows.map((r) => ({
    date: r.date,
    sessionCount: Number(r.sessionCount),
    totalRevenueCentavos: Number(r.totalRevenue),
    totalRevenueDisplay: `₱${(Number(r.totalRevenue) / 100).toFixed(2)}`,
  }))
}

export async function getPeakHours(year: number, month: number): Promise<HourlyBucket[]> {
  const pad = (n: number) => String(n).padStart(2, '0')
  const start = new Date(`${year}-${pad(month)}-01T00:00:00.000Z`)
  const endMonth = month === 12 ? 1 : month + 1
  const endYear = month === 12 ? year + 1 : year
  const end = new Date(`${endYear}-${pad(endMonth)}-01T00:00:00.000Z`)

  const rows = await db
    .select({
      hour: sql<number>`cast(strftime('%H', ${sessions.timeIn} / 1000, 'unixepoch') as integer)`,
      count: sql<number>`count(*)`,
    })
    .from(sessions)
    .where(
      and(
        eq(sessions.status, 'COMPLETED'),
        gte(sessions.timeIn, start),
        lte(sessions.timeIn, end),
      ),
    )
    .groupBy(sql`strftime('%H', ${sessions.timeIn} / 1000, 'unixepoch')`)
    .orderBy(sql`strftime('%H', ${sessions.timeIn} / 1000, 'unixepoch')`)

  return rows.map((r) => ({ hour: Number(r.hour), count: Number(r.count) }))
}
