import { sql } from 'drizzle-orm'
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

export const attendance = sqliteTable('attendance', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  timeIn: integer('time_in', { mode: 'timestamp' }).notNull(),
  timeOut: integer('time_out', { mode: 'timestamp' }),
  status: text('status', { enum: ['CLOCKED_IN', 'CLOCKED_OUT'] }).notNull().default('CLOCKED_IN'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export const attendanceRelations = relations(attendance, ({ one }) => ({
  user: one(users, { fields: [attendance.userId], references: [users.id] }),
}))

export type Attendance = typeof attendance.$inferSelect
export type NewAttendance = typeof attendance.$inferInsert
export type AttendanceStatus = 'CLOCKED_IN' | 'CLOCKED_OUT'
