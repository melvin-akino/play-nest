import { sql } from 'drizzle-orm'
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { sessions } from './sessions'
import { users } from './users'

export const payments = sqliteTable('payments', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => sessions.id),
  amount: integer('amount').notNull(), // centavos
  method: text('method', { enum: ['CASH', 'GCASH'] }).notNull(),
  receivedBy: text('received_by').notNull().references(() => users.id),
  paidAt: integer('paid_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  voided: integer('voided', { mode: 'boolean' }).notNull().default(false),
  voidedReason: text('voided_reason'),
  voidedBy: text('voided_by').references(() => users.id),
  voidedAt: integer('voided_at', { mode: 'timestamp' }),
})

export const paymentsRelations = relations(payments, ({ one }) => ({
  session: one(sessions, { fields: [payments.sessionId], references: [sessions.id] }),
  staff: one(users, { fields: [payments.receivedBy], references: [users.id] }),
  voidedByUser: one(users, { fields: [payments.voidedBy], references: [users.id] }),
}))

export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert
export type PaymentMethod = 'CASH' | 'GCASH'
