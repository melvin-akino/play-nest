import { NextResponse } from 'next/server'
import { logger } from '@/lib/config/logger'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export function serverErr(error: unknown) {
  logger.error(error)
  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
}
