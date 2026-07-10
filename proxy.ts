import { auth } from '@/lib/config/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  if (!isLoggedIn && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/pos', req.url))
  }

  // Admin-only routes
  if (pathname.startsWith('/admin') && req.auth?.user.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/pos', req.url))
  }

  return NextResponse.next()
})

export const config = {
  // Exclude API routes, Next internals, and any static file in /public
  // (images, icons, etc.) — those must load even on the unauthenticated
  // /login screen, otherwise the auth redirect turns the asset request
  // itself into a redirect to /login.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)'],
}
