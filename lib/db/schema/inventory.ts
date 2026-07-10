import { sql } from 'drizzle-orm'
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

export const items = sqliteTable('items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  sku: text('sku').notNull().unique(),
  category: text('category').notNull().default('General'),
  price: integer('price').notNull(), // centavos
  stockQty: integer('stock_qty').notNull().default(0),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(5),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export const itemSales = sqliteTable('item_sales', {
  id: text('id').primaryKey(),
  itemId: text('item_id').notNull().references(() => items.id),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(), // centavos, snapshot at time of sale
  totalAmount: integer('total_amount').notNull(), // centavos
  paymentMethod: text('payment_method', { enum: ['CASH', 'GCASH'] }).notNull(),
  soldBy: text('sold_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export const itemsRelations = relations(items, ({ many }) => ({
  sales: many(itemSales),
}))

export const itemSalesRelations = relations(itemSales, ({ one }) => ({
  item: one(items, { fields: [itemSales.itemId], references: [items.id] }),
  staff: one(users, { fields: [itemSales.soldBy], references: [users.id] }),
}))

export type Item = typeof items.$inferSelect
export type NewItem = typeof items.$inferInsert
export type ItemSale = typeof itemSales.$inferSelect
export type NewItemSale = typeof itemSales.$inferInsert
