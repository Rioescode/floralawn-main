import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Protected API routes that require authentication
  const protectedApiRoutes = [
    '/api/generate-notes',
    '/api/generate-thanks', 
    '/api/extract-notes',
    '/api/parse-customers'
  ]

  // Admin-only routes
  const adminRoutes = [
    '/api/email-subscribers'
  ]

  const { pathname } = req.nextUrl

  // Check if route needs protection
  if (protectedApiRoutes.some(route => pathname.startsWith(route))) {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
  }

  // Check admin routes
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin (you'll need to implement admin role check)
    // For now, just require authentication
  }

  return res
}

export const config = {
  matcher: [
    '/api/generate-notes/:path*',
    '/api/generate-thanks/:path*',
    '/api/extract-notes/:path*',
    '/api/parse-customers/:path*',
    '/api/email-subscribers/:path*'
  ]
}