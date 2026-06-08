import { migrate } from 'drizzle-orm/libsql/migrator'
import { db } from './client'
import { logger } from '@/lib/config/logger'
import path from 'path'

export async function runMigrations() {
  // In production/desktop the CWD may differ — resolve relative to this file
  const migrationsFolder = path.resolve(process.cwd(), 'lib/db/migrations')
  try {
    await migrate(db, { migrationsFolder })
    logger.info('db migrations applied')
  } catch (err) {
    logger.error({ err }, 'db migration failed')
    throw err
  }
}
