import { db } from './client'
import { users, rates, items } from './schema'
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

  // Typical items sold at PH mall indoor playgrounds
  const starterItems = [
    { name: 'Bottled Water 500ml', sku: 'BEV-WATER-500', category: 'Beverages', price: 2500, stockQty: 50 },
    { name: 'Soda Can', sku: 'BEV-SODA-CAN', category: 'Beverages', price: 4000, stockQty: 40 },
    { name: 'Juice Box', sku: 'BEV-JUICE-BOX', category: 'Beverages', price: 3500, stockQty: 40 },
    { name: 'Chips (Small Pack)', sku: 'SNK-CHIPS-SM', category: 'Snacks', price: 3000, stockQty: 50 },
    { name: 'Chocolate Bar', sku: 'SNK-CHOC-BAR', category: 'Snacks', price: 3500, stockQty: 50 },
    { name: 'Gummy Candy Pack', sku: 'SNK-GUMMY', category: 'Snacks', price: 2500, stockQty: 50 },
    { name: 'Ice Cream Cup', sku: 'SNK-ICECREAM', category: 'Snacks', price: 5500, stockQty: 25 },
    { name: 'Hotdog on Stick', sku: 'SNK-HOTDOG', category: 'Snacks', price: 4500, stockQty: 30 },
    { name: 'Grip Socks (Kids)', sku: 'MDS-SOCKS-KID', category: 'Merchandise', price: 8000, stockQty: 30 },
    { name: 'Grip Socks (Adult)', sku: 'MDS-SOCKS-ADT', category: 'Merchandise', price: 9000, stockQty: 20 },
    { name: 'Jungle Gym T-Shirt', sku: 'MDS-SHIRT', category: 'Merchandise', price: 25000, stockQty: 15 },
    { name: 'Souvenir Keychain', sku: 'MDS-KEYCHAIN', category: 'Merchandise', price: 6000, stockQty: 30 },
    { name: 'Extra Play Wristband', sku: 'MDS-WRISTBAND', category: 'Merchandise', price: 3000, stockQty: 40 },
  ]

  for (const item of starterItems) {
    await db.insert(items).values({
      id: uuidv4(),
      ...item,
      lowStockThreshold: 5,
      isActive: true,
    }).onConflictDoNothing()
  }

  console.log('Seed complete.')
  console.log('Admin: admin@playnest.local / admin1234')
  console.log('Cashier: cashier@playnest.local / cashier1234')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
