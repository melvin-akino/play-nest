import { db } from '@/lib/db/client'
import { items, itemSales } from '@/lib/db/schema'
import { eq, and, lte, gte } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { logger } from '@/lib/config/logger'

export const CreateItemSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  category: z.string().min(1).default('General'),
  price: z.number().int().positive(), // centavos
  stockQty: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
})

export const SellCartSchema = z.object({
  cart: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().int().positive(),
  })).min(1),
  paymentMethod: z.enum(['CASH', 'GCASH']),
})

export type CreateItemDTO = z.infer<typeof CreateItemSchema>
export type SellCartDTO = z.infer<typeof SellCartSchema>

export async function listItems() {
  return db.query.items.findMany({ orderBy: (i, { asc }) => [asc(i.name)] })
}

export async function createItem(data: CreateItemDTO) {
  const [item] = await db.insert(items).values({ id: uuidv4(), ...data }).returning()
  return item
}

export async function updateItem(itemId: string, data: Partial<CreateItemDTO> & { isActive?: boolean }) {
  const [item] = await db.update(items).set(data).where(eq(items.id, itemId)).returning()
  if (!item) throw new Error('Item not found')
  return item
}

export async function adjustStock(itemId: string, delta: number) {
  const item = await db.query.items.findFirst({ where: eq(items.id, itemId) })
  if (!item) throw new Error('Item not found')
  const newQty = item.stockQty + delta
  if (newQty < 0) throw new Error('Insufficient stock')

  const [updated] = await db.update(items).set({ stockQty: newQty }).where(eq(items.id, itemId)).returning()
  return updated
}

export async function getLowStockItems() {
  const all = await db.query.items.findMany({ where: eq(items.isActive, true) })
  return all.filter(i => i.stockQty <= i.lowStockThreshold)
}

export async function sellItems(data: SellCartDTO, staffId: string) {
  return db.transaction(async (tx) => {
    const sales = []
    let totalAmount = 0

    for (const line of data.cart) {
      const item = await tx.query.items.findFirst({ where: eq(items.id, line.itemId) })
      if (!item) throw new Error(`Item ${line.itemId} not found`)
      if (!item.isActive) throw new Error(`Item ${item.name} is not active`)
      if (item.stockQty < line.quantity) throw new Error(`Insufficient stock for ${item.name}`)

      const lineTotal = item.price * line.quantity
      totalAmount += lineTotal

      await tx.update(items)
        .set({ stockQty: item.stockQty - line.quantity })
        .where(eq(items.id, item.id))

      const [sale] = await tx.insert(itemSales).values({
        id: uuidv4(),
        itemId: item.id,
        quantity: line.quantity,
        unitPrice: item.price,
        totalAmount: lineTotal,
        paymentMethod: data.paymentMethod,
        soldBy: staffId,
      }).returning()

      sales.push(sale)
    }

    logger.info({ staffId, totalAmount, itemCount: sales.length }, 'inventory.sold')
    return { sales, totalAmount }
  })
}

export async function getSalesForDateRange(from: Date, to: Date) {
  return db.query.itemSales.findMany({
    where: and(gte(itemSales.createdAt, from), lte(itemSales.createdAt, to)),
    with: { item: true, staff: true },
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  })
}
