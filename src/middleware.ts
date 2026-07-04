import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout', '/api/auth/workspaces/config']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir rutas publicas y assets
  if (
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Verificar cookie de sesion
  const session = request.cookies.get('tickos-session')?.value

  if (!session) {
    const loginUrl = new URL('/login', request.url)
    const response = NextResponse.redirect(loginUrl)

    // Limpiar cookies viejas del setup anterior
    response.cookies.delete('tickos_api_key')
    response.cookies.delete('tickos_user_email')

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
