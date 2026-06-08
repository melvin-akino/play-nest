import { sql } from 'drizzle-orm'
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core'

// Amounts stored in centavos (₱1 = 100) to avoid float precision issues
export const rates = sqliteTable('rates', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  pricePerHour: integer('price_per_hour').notNull(), // in centavos
  minMinutes: integer('min_minutes').notNull().default(30),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export type Rate = typeof rates.$inferSelect
export type NewRate = typeof rates.$inferInsert
