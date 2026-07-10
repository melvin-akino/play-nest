import { sql } from 'drizzle-orm'
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { children } from './customers'
import { rates } from './rates'
import { users } from './users'

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  childId: text('child_id').notNull().references(() => children.id),
  rateId: text('rate_id').notNull().references(() => rates.id),
  staffId: text('staff_id').notNull().references(() => users.id),
  status: text('status', { enum: ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'] }).notNull().default('PENDING'),
  timeIn: integer('time_in', { mode: 'timestamp' }),
  timeOut: integer('time_out', { mode: 'timestamp' }),
  durationMinutes: integer('duration_minutes'),
  amountDue: integer('amount_due'), // centavos
  // Physical QR sticker code assigned from the qr_codes inventory. Not
  // unique here — the same sticker is returned to the pool and reused
  // across many sessions over its lifetime.
  qrCode: text('qr_code').notNull(),
  // Snapshot of rate at time of session (rate may change later)
  rateSnapshot: text('rate_snapshot', { mode: 'json' }).$type<{ label: string; pricePerHour: number }>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export const sessionsRelations = relations(sessions, ({ one }) => ({
  child: one(children, { fields: [sessions.childId], references: [children.id] }),
  rate: one(rates, { fields: [sessions.rateId], references: [rates.id] }),
  staff: one(users, { fields: [sessions.staffId], references: [users.id] }),
}))

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type SessionStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
