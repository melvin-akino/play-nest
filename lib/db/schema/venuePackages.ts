import { sql } from 'drizzle-orm'
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core'

// Admin-managed presets for venue rental pricing, e.g. "3-Hour Package",
// "Whole Day", "Extra Hour" — selectable when creating a booking.
export const venuePackages = sqliteTable('venue_packages', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  pricingType: text('pricing_type', { enum: ['FLAT', 'HOURLY'] }).notNull(),
  amount: integer('amount').notNull(), // centavos — flat total or per-hour rate
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export type VenuePackage = typeof venuePackages.$inferSelect
export type NewVenuePackage = typeof venuePackages.$inferInsert
export type PricingType = 'FLAT' | 'HOURLY'
