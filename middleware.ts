import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export const middleware = withAuth(
  function middleware(req) {
    // If user is not authenticated, redirect to home
    if (!req.nextauth.token) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ['/dashboard/:path*'],
}
