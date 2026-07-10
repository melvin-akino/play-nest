import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/server'
import { db } from '@/lib/db/client'
import { webauthnCredentials, webauthnChallenges, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '@/lib/config/logger'

const RP_NAME = 'Jungle Gym Play House'

// WebAuthn requires the RP ID (bare domain, no scheme/port) and the full
// origin to match what the browser actually navigated to. Both default to
// NEXTAUTH_URL so no extra config is needed in the common case, but can be
// overridden if the app is ever served from a different public URL than
// NEXTAUTH_URL implies (e.g. behind a proxy).
function getRpID(): string {
  const url = process.env.WEBAUTHN_RP_ID ?? process.env.NEXTAUTH_URL ?? 'localhost'
  try {
    return new URL(url).hostname
  } catch {
    return url // already a bare hostname
  }
}

function getOrigin(): string {
  return process.env.WEBAUTHN_ORIGIN ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
}

async function setChallenge(userId: string, challenge: string) {
  await db.insert(webauthnChallenges)
    .values({ userId, challenge })
    .onConflictDoUpdate({ target: webauthnChallenges.userId, set: { challenge, createdAt: new Date() } })
}

async function consumeChallenge(userId: string): Promise<string> {
  const row = await db.query.webauthnChallenges.findFirst({ where: eq(webauthnChallenges.userId, userId) })
  if (!row) throw new Error('No pending challenge — start enrollment or sign-in again')
  await db.delete(webauthnChallenges).where(eq(webauthnChallenges.userId, userId))
  return row.challenge
}

export async function listCredentials(userId: string) {
  return db.query.webauthnCredentials.findMany({ where: eq(webauthnCredentials.userId, userId) })
}

export async function generateEnrollmentOptions(targetUserId: string) {
  const targetUser = await db.query.users.findFirst({ where: eq(users.id, targetUserId) })
  if (!targetUser) throw new Error('User not found')

  const existing = await listCredentials(targetUserId)

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: getRpID(),
    userName: targetUser.email,
    userDisplayName: targetUser.name,
    attestationType: 'none',
    excludeCredentials: existing.map(c => ({ id: c.credentialId })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'required',
      authenticatorAttachment: 'platform', // built-in biometric (Windows Hello / Touch ID), not a USB key
    },
  })

  await setChallenge(targetUserId, options.challenge)
  return options
}

export async function verifyEnrollment(targetUserId: string, response: RegistrationResponseJSON, deviceLabel?: string) {
  const expectedChallenge = await consumeChallenge(targetUserId)

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: getOrigin(),
    expectedRPID: getRpID(),
  })

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error('Biometric enrollment could not be verified')
  }

  const { credential } = verification.registrationInfo
  const [row] = await db.insert(webauthnCredentials).values({
    id: uuidv4(),
    userId: targetUserId,
    credentialId: credential.id,
    publicKey: Buffer.from(credential.publicKey).toString('base64url'),
    counter: credential.counter,
    deviceLabel,
  }).returning()

  logger.info({ userId: targetUserId, credentialDbId: row.id }, 'webauthn.enrolled')
  return row
}

export async function generateClockInChallenge(userId: string) {
  const creds = await listCredentials(userId)
  if (creds.length === 0) throw new Error('No enrolled biometric device for this account')

  const options = await generateAuthenticationOptions({
    rpID: getRpID(),
    userVerification: 'required',
    allowCredentials: creds.map(c => ({ id: c.credentialId })),
  })

  await setChallenge(userId, options.challenge)
  return options
}

export async function verifyClockInChallenge(userId: string, response: AuthenticationResponseJSON) {
  const expectedChallenge = await consumeChallenge(userId)

  const stored = await db.query.webauthnCredentials.findFirst({
    where: eq(webauthnCredentials.credentialId, response.id),
  })
  if (!stored || stored.userId !== userId) throw new Error('Credential not recognized for this account')

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: getOrigin(),
    expectedRPID: getRpID(),
    credential: {
      id: stored.credentialId,
      publicKey: new Uint8Array(Buffer.from(stored.publicKey, 'base64url')),
      counter: stored.counter,
    },
  })

  if (!verification.verified) throw new Error('Biometric verification failed')

  await db.update(webauthnCredentials)
    .set({ counter: verification.authenticationInfo.newCounter })
    .where(eq(webauthnCredentials.id, stored.id))

  return true
}

export async function revokeCredential(credentialDbId: string, requesterId: string, requesterRole: string) {
  const cred = await db.query.webauthnCredentials.findFirst({ where: eq(webauthnCredentials.id, credentialDbId) })
  if (!cred) throw new Error('Credential not found')
  if (requesterRole !== 'ADMIN' && cred.userId !== requesterId) throw new Error('Forbidden')

  await db.delete(webauthnCredentials).where(eq(webauthnCredentials.id, credentialDbId))
}
