import { db } from '@/lib/db/client'
import { attendance } from '@/lib/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '@/lib/config/logger'

export async function clockIn(userId: string) {
  const existing = await db.query.attendance.findFirst({
    where: and(eq(attendance.userId, userId), eq(attendance.status, 'CLOCKED_IN')),
  })
  if (existing) throw new Error('Already clocked in')

  const [row] = await db.insert(attendance).values({
    id: uuidv4(),
    userId,
    timeIn: new Date(),
    status: 'CLOCKED_IN',
  }).returning()

  logger.info({ userId, attendanceId: row.id }, 'attendance.clockIn')
  return row
}

export async function clockOut(userId: string) {
  const existing = await db.query.attendance.findFirst({
    where: and(eq(attendance.userId, userId), eq(attendance.status, 'CLOCKED_IN')),
  })
  if (!existing) throw new Error('Not clocked in')

  const [row] = await db.update(attendance)
    .set({ status: 'CLOCKED_OUT', timeOut: new Date() })
    .where(eq(attendance.id, existing.id))
    .returning()

  logger.info({ userId, attendanceId: row.id }, 'attendance.clockOut')
  return row
}

export async function getActiveShifts() {
  return db.query.attendance.findMany({
    where: eq(attendance.status, 'CLOCKED_IN'),
    with: { user: true },
    orderBy: (a, { asc }) => [asc(a.timeIn)],
  })
}

export async function getMyStatus(userId: string) {
  return db.query.attendance.findFirst({
    where: and(eq(attendance.userId, userId), eq(attendance.status, 'CLOCKED_IN')),
  })
}

export async function getAttendanceHistory(from: Date, to: Date, userId?: string) {
  return db.query.attendance.findMany({
    where: userId
      ? and(eq(attendance.userId, userId), gte(attendance.timeIn, from), lte(attendance.timeIn, to))
      : and(gte(attendance.timeIn, from), lte(attendance.timeIn, to)),
    with: { user: true },
    orderBy: (a, { desc }) => [desc(a.timeIn)],
  })
}
