import { NextRequest } from 'next/server'
import { auth } from '@/lib/config/auth'
import { ok, err, serverErr } from '@/lib/api/response'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const CreateStaffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['CASHIER', 'ADMIN']).default('CASHIER'),
})

const UpdateStaffSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean().optional(),
  role: z.enum(['CASHIER', 'ADMIN']).optional(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)
    if (session.user.role !== 'ADMIN') return err('Forbidden', 403)

    const staff = await db.query.users.findMany({
      orderBy: (u, { asc }) => [asc(u.name)],
      columns: { passwordHash: false },
    })
    return ok(staff)
  } catch (e) {
    return serverErr(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)
    if (session.user.role !== 'ADMIN') return err('Forbidden', 403)

    const body = await req.json()
    const parsed = CreateStaffSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const passwordHash = await bcrypt.hash(parsed.data.password, 10)
    const [user] = await db.insert(users).values({
      id: uuidv4(),
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
    }).returning({ id: users.id, name: users.name, email: users.email, role: users.role })

    return ok(user, 201)
  } catch (e) {
    return serverErr(e)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return err('Unauthorized', 401)
    if (session.user.role !== 'ADMIN') return err('Forbidden', 403)

    const body = await req.json()
    const parsed = UpdateStaffSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const { id, ...updates } = parsed.data
    const [user] = await db.update(users).set(updates).where(eq(users.id, id))
      .returning({ id: users.id, name: users.name, email: users.email, role: users.role, isActive: users.isActive })

    return ok(user)
  } catch (e) {
    return serverErr(e)
  }
}
