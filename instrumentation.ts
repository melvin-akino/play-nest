export async function register() {
  // Only run on the Node.js server (not Edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { runMigrations } = await import('./lib/db/migrate')
    await runMigrations()
  }
}
