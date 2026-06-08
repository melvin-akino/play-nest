import { db } from '@/lib/db/client'
import { guardians, children } from '@/lib/db/schema'
import { eq, like } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

export const CreateGuardianSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(7),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
})

export const CreateChildSchema = z.object({
  name: z.string().min(2),
  birthdate: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  notes: z.string().optional(),
})

export type CreateGuardianDTO = z.infer<typeof CreateGuardianSchema>
export type CreateChildDTO = z.infer<typeof CreateChildSchema>

export async function findGuardianByPhone(phone: string) {
  return db.query.guardians.findFirst({
    where: eq(guardians.phone, phone),
    with: { children: true },
  })
}

export async function searchGuardians(query: string) {
  return db.query.guardians.findMany({
    where: like(guardians.name, `%${query}%`),
    with: { children: true },
    limit: 20,
  })
}

export async function createGuardian(data: CreateGuardianDTO) {
  const [guardian] = await db.insert(guardians).values({ id: uuidv4(), ...data }).returning()
  return guardian
}

export async function addChild(guardianId: string, data: CreateChildDTO) {
  const [child] = await db.insert(children).values({ id: uuidv4(), guardianId, ...data }).returning()
  return child
}

export async function getGuardian(id: string) {
  return db.query.guardians.findFirst({
    where: eq(guardians.id, id),
    with: { children: true },
  })
}

export async function listGuardians(limit = 50, offset = 0) {
  return db.query.guardians.findMany({
    with: { children: true },
    limit,
    offset,
    orderBy: (g, { desc }) => [desc(g.createdAt)],
  })
}
