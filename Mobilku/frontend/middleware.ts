import { NextRequest, NextResponse } from 'next/server'

// Routes yang memerlukan authentication
const protectedRoutes = [
  '/cart',
  '/checkout',
  '/orders',
  '/wishlist',
  '/profile',
  '/admin',
]

// Routes yang hanya untuk unauthenticated users
const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password']

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const token = request.cookies.get('token')?.value

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = pathname.startsWith('/admin')

  // Jika akses halaman yang memerlukan auth tapi belum login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Jika sudah login tapi akses halaman login/register, redirect ke homepage
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
