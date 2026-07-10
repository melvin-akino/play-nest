import { sql } from 'drizzle-orm'
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core'

export const qrCodes = sqliteTable('qr_codes', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  status: text('status', { enum: ['AVAILABLE', 'ASSIGNED'] }).notNull().default('AVAILABLE'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export type QrCode = typeof qrCodes.$inferSelect
export type NewQrCode = typeof qrCodes.$inferInsert
export type QrCodeStatus = 'AVAILABLE' | 'ASSIGNED'
