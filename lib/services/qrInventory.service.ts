import { db } from '@/lib/db/client'
import { qrCodes } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'
import { logger } from '@/lib/config/logger'

function randomCode(): string {
  return `JG-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
}

export async function generateBatch(count: number) {
  const created = []
  for (let i = 0; i < count; i++) {
    // Retry on the rare random collision with an existing code
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const [row] = await db.insert(qrCodes).values({
          id: uuidv4(),
          code: randomCode(),
          status: 'AVAILABLE',
        }).returning()
        created.push(row)
        break
      } catch (e) {
        if (attempt === 4) throw e
      }
    }
  }
  logger.info({ count: created.length }, 'qrInventory.batchGenerated')
  return created
}

export async function addManualCode(code: string) {
  const trimmed = code.trim()
  if (!trimmed) throw new Error('Code cannot be empty')

  const existing = await db.query.qrCodes.findFirst({ where: eq(qrCodes.code, trimmed) })
  if (existing) throw new Error('Code already exists')

  const [row] = await db.insert(qrCodes).values({
    id: uuidv4(),
    code: trimmed,
    status: 'AVAILABLE',
  }).returning()
  return row
}

export async function listCodes(status?: 'AVAILABLE' | 'ASSIGNED') {
  return db.query.qrCodes.findMany({
    where: status ? eq(qrCodes.status, status) : undefined,
    orderBy: (q, { desc }) => [desc(q.createdAt)],
  })
}

export async function assignCode(code: string) {
  const row = await db.query.qrCodes.findFirst({ where: eq(qrCodes.code, code) })
  if (!row) throw new Error('QR code not found in inventory')
  if (row.status !== 'AVAILABLE') throw new Error('QR code is already in use')

  const [updated] = await db.update(qrCodes)
    .set({ status: 'ASSIGNED' })
    .where(eq(qrCodes.id, row.id))
    .returning()
  return updated
}

export async function releaseCode(code: string) {
  // Idempotent — a code that isn't tracked (e.g. legacy sessions) is a no-op
  await db.update(qrCodes).set({ status: 'AVAILABLE' }).where(eq(qrCodes.code, code))
}

export async function retireCode(id: string) {
  const row = await db.query.qrCodes.findFirst({ where: eq(qrCodes.id, id) })
  if (!row) throw new Error('QR code not found')
  if (row.status === 'ASSIGNED') throw new Error('Cannot retire a code currently in use')
  await db.delete(qrCodes).where(eq(qrCodes.id, id))
}
