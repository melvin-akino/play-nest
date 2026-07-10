import { sql } from 'drizzle-orm'
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

export const webauthnCredentials = sqliteTable('webauthn_credentials', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  credentialId: text('credential_id').notNull().unique(), // base64url
  publicKey: text('public_key').notNull(), // base64url-encoded Uint8Array
  counter: integer('counter').notNull().default(0),
  deviceLabel: text('device_label'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export const webauthnCredentialsRelations = relations(webauthnCredentials, ({ one }) => ({
  user: one(users, { fields: [webauthnCredentials.userId], references: [users.id] }),
}))

// One pending registration/authentication challenge per user at a time.
// Short-lived — overwritten on every new ceremony, consumed on verify.
export const webauthnChallenges = sqliteTable('webauthn_challenges', {
  userId: text('user_id').primaryKey().references(() => users.id),
  challenge: text('challenge').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export type WebauthnCredential = typeof webauthnCredentials.$inferSelect
export type NewWebauthnCredential = typeof webauthnCredentials.$inferInsert
