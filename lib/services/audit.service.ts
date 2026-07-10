import { db } from '@/lib/db/client'
import { auditLogs } from '@/lib/db/schema'
import { and, eq, gte, lte } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '@/lib/config/logger'

// Never throws — an audit-log write failure must not fail the action it's
// describing. Failures are logged instead.
export async function logAction(userId: string, action: string, details?: Record<string, unknown>) {
  try {
    await db.insert(auditLogs).values({
      id: uuidv4(),
      userId,
      action,
      details: details ? JSON.stringify(details) : null,
    })
  } catch (e) {
    logger.error({ e, userId, action }, 'audit.logFailed')
  }
}

export async function listAuditLogs(opts: { userId?: string; from?: Date; to?: Date; limit?: number } = {}) {
  const { userId, from, to, limit = 200 } = opts
  const conditions = []
  if (userId) conditions.push(eq(auditLogs.userId, userId))
  if (from) conditions.push(gte(auditLogs.createdAt, from))
  if (to) conditions.push(lte(auditLogs.createdAt, to))

  return db.query.auditLogs.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    with: { user: true },
    orderBy: (a, { desc }) => [desc(a.createdAt)],
    limit,
  })
}
