import { NextRequest, NextResponse } from 'next/server'
import { createSession, getSessionCookieName } from '@/lib/auth'
import { getWorkspaces } from '@/lib/workspaces'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const workspaces = getWorkspaces()
    if (workspaces.length === 0) {
      return NextResponse.json(
        { error: 'No workspaces configured. Add a workspace from Settings or set TICKOS_WORKSPACES in environment variables.' },
        { status: 500 }
      )
    }

    // Intentar login en cada workspace configurado
    let authenticatedUser: {
      id: string
      email: string
      full_name: string | null
      role: string
    } | null = null

    for (const workspace of workspaces) {
      try {
        const response = await fetch(`${workspace.url}/api/v1/auth/login`, {
          method: 'POST',
          headers: {
            'Authorization': workspace.key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        })

        if (response.ok) {
          const result = await response.json()
          authenticatedUser = result.data
          break
        }
      } catch {
        // Intentar siguiente workspace
        continue
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Crear session JWT
    const token = await createSession({
      userId: authenticatedUser.id,
      email: authenticatedUser.email,
      fullName: authenticatedUser.full_name,
      role: authenticatedUser.role,
    })

    // Retornar con cookie de sesion
    const res = NextResponse.json({
      success: true,
      user: {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        full_name: authenticatedUser.full_name,
        role: authenticatedUser.role,
      },
      workspaces: workspaces.map(w => w.name),
    })

    res.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    })

    return res
  } catch (error) {
    console.error('[Auth] Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
