import authMiddleware from 'next-auth/middleware'

export const middleware = authMiddleware

export const config = {
  matcher: ['/dashboard/:path*'],
}
