import { db } from '@/lib/db/client'
import { venuePackages } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

export const CreateVenuePackageSchema = z.object({
  label: z.string().min(2),
  pricingType: z.enum(['FLAT', 'HOURLY']),
  amount: z.number().int().positive(), // centavos
})

export type CreateVenuePackageDTO = z.infer<typeof CreateVenuePackageSchema>

export async function listVenuePackages() {
  return db.query.venuePackages.findMany({ orderBy: (p, { desc }) => [desc(p.createdAt)] })
}

export async function createVenuePackage(data: CreateVenuePackageDTO) {
  const [pkg] = await db.insert(venuePackages).values({ id: uuidv4(), ...data }).returning()
  return pkg
}

export async function setVenuePackageActive(id: string, isActive: boolean) {
  const [pkg] = await db.update(venuePackages).set({ isActive }).where(eq(venuePackages.id, id)).returning()
  if (!pkg) throw new Error('Package not found')
  return pkg
}
