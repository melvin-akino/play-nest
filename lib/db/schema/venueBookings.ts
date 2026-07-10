import { sql } from 'drizzle-orm'
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { venuePackages } from './venuePackages'

export const venueBookings = sqliteTable('venue_bookings', {
  id: text('id').primaryKey(),
  packageId: text('package_id').references(() => venuePackages.id),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  eventName: text('event_name'),
  scheduledStart: integer('scheduled_start', { mode: 'timestamp' }).notNull(),
  scheduledEnd: integer('scheduled_end', { mode: 'timestamp' }).notNull(),
  actualStart: integer('actual_start', { mode: 'timestamp' }),
  actualEnd: integer('actual_end', { mode: 'timestamp' }),
  guestCountEstimate: integer('guest_count_estimate'),
  pricingType: text('pricing_type', { enum: ['FLAT', 'HOURLY'] }).notNull(),
  totalAmount: integer('total_amount').notNull(), // centavos
  // Whether this booking blocks the whole venue for walk-ins (shows a
  // warning banner at Front Desk) — always true in practice today, but
  // kept as a toggle for future partial-rental scenarios.
  exclusive: integer('exclusive', { mode: 'boolean' }).notNull().default(true),
  status: text('status', { enum: ['RESERVED', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'] }).notNull().default('RESERVED'),
  cancelReason: text('cancel_reason'),
  cancelledBy: text('cancelled_by').references(() => users.id),
  cancelledAt: integer('cancelled_at', { mode: 'timestamp' }),
  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export const venueBookingsRelations = relations(venueBookings, ({ one }) => ({
  package: one(venuePackages, { fields: [venueBookings.packageId], references: [venuePackages.id] }),
  createdByUser: one(users, { fields: [venueBookings.createdBy], references: [users.id] }),
  cancelledByUser: one(users, { fields: [venueBookings.cancelledBy], references: [users.id] }),
}))

export type VenueBooking = typeof venueBookings.$inferSelect
export type NewVenueBooking = typeof venueBookings.$inferInsert
export type VenueBookingStatus = 'RESERVED' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
