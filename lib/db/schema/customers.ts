import { sql } from 'drizzle-orm'
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

export const guardians = sqliteTable('guardians', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull().unique(),
  address: text('address'),
  emergencyContact: text('emergency_contact'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export const children = sqliteTable('children', {
  id: text('id').primaryKey(),
  guardianId: text('guardian_id').notNull().references(() => guardians.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  birthdate: text('birthdate'),
  gender: text('gender', { enum: ['MALE', 'FEMALE', 'OTHER'] }),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export const guardiansRelations = relations(guardians, ({ many }) => ({
  children: many(children),
}))

export const childrenRelations = relations(children, ({ one }) => ({
  guardian: one(guardians, { fields: [children.guardianId], references: [guardians.id] }),
}))

export type Guardian = typeof guardians.$inferSelect
export type NewGuardian = typeof guardians.$inferInsert
export type Child = typeof children.$inferSelect
export type NewChild = typeof children.$inferInsert
