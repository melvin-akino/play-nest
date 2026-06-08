import { db } from '@/lib/db/client'
import { rates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

export const CreateRateSchema = z.object({
  label: z.string().min(2),
  pricePerHour: z.number().int().positive(), // centavos
  minMinutes: z.number().int().min(1).default(30),
})

export type CreateRateDTO = z.infer<typeof CreateRateSchema>

export async function getActiveRate() {
  const rate = await db.query.rates.findFirst({
    where: eq(rates.isActive, true),
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  })
  if (!rate) throw new Error('No active rate configured')
  return rate
}

export async function listRates() {
  return db.query.rates.findMany({ orderBy: (r, { desc }) => [desc(r.createdAt)] })
}

export async function createRate(data: CreateRateDTO) {
  const [rate] = await db.insert(rates).values({ id: uuidv4(), ...data }).returning()
  return rate
}

export async function setActiveRate(rateId: string) {
  // Deactivate all, then activate the target
  await db.update(rates).set({ isActive: false })
  const [rate] = await db.update(rates).set({ isActive: true, updatedAt: new Date() })
    .where(eq(rates.id, rateId)).returning()
  if (!rate) throw new Error('Rate not found')
  return rate
}

export async function deleteRate(rateId: string) {
  await db.update(rates).set({ isActive: false }).where(eq(rates.id, rateId))
}
