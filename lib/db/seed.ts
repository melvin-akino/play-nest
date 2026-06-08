import { db } from './client'
import { users, rates } from './schema'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

async function seed() {
  console.log('Seeding database...')

  // Admin user
  const adminId = uuidv4()
  await db.insert(users).values({
    id: adminId,
    name: 'Admin',
    email: 'admin@playnest.local',
    passwordHash: await bcrypt.hash('admin1234', 10),
    role: 'ADMIN',
    isActive: true,
  }).onConflictDoNothing()

  // Cashier user
  await db.insert(users).values({
    id: uuidv4(),
    name: 'Cashier 1',
    email: 'cashier@playnest.local',
    passwordHash: await bcrypt.hash('cashier1234', 10),
    role: 'CASHIER',
    isActive: true,
  }).onConflictDoNothing()

  // Default rate: ₱60/hour, minimum 30 minutes
  await db.insert(rates).values({
    id: uuidv4(),
    label: 'Standard Rate',
    pricePerHour: 6000, // ₱60.00 in centavos
    minMinutes: 30,
    isActive: true,
  }).onConflictDoNothing()

  console.log('Seed complete.')
  console.log('Admin: admin@playnest.local / admin1234')
  console.log('Cashier: cashier@playnest.local / cashier1234')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
