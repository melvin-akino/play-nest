import { sql } from 'drizzle-orm'
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { venueBookings } from './venueBookings'

export const bookingPayments = sqliteTable('booking_payments', {
  id: text('id').primaryKey(),
  bookingId: text('booking_id').notNull().references(() => venueBookings.id),
  type: text('type', { enum: ['DEPOSIT', 'BALANCE', 'FULL'] }).notNull(),
  amount: integer('amount').notNull(), // centavos
  method: text('method', { enum: ['CASH', 'GCASH'] }).notNull(),
  receivedBy: text('received_by').notNull().references(() => users.id),
  paidAt: integer('paid_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  voided: integer('voided', { mode: 'boolean' }).notNull().default(false),
  voidedReason: text('voided_reason'),
  voidedBy: text('voided_by').references(() => users.id),
  voidedAt: integer('voided_at', { mode: 'timestamp' }),
})

export const bookingPaymentsRelations = relations(bookingPayments, ({ one }) => ({
  booking: one(venueBookings, { fields: [bookingPayments.bookingId], references: [venueBookings.id] }),
  staff: one(users, { fields: [bookingPayments.receivedBy], references: [users.id] }),
  voidedByUser: one(users, { fields: [bookingPayments.voidedBy], references: [users.id] }),
}))

export type BookingPayment = typeof bookingPayments.$inferSelect
export type NewBookingPayment = typeof bookingPayments.$inferInsert
export type BookingPaymentType = 'DEPOSIT' | 'BALANCE' | 'FULL'
