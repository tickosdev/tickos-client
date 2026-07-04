import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getWorkspaces } from '@/lib/workspaces'

// GET - listar workspaces configurados
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const workspaces = getWorkspaces()

  return NextResponse.json({
    data: workspaces.map(w => ({ name: w.name })),
  })
}

// POST - cambiar workspace activo
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { name } = await request.json()
  const workspaces = getWorkspaces()
  const found = workspaces.find(w => w.name === name)

  if (!found) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  const res = NextResponse.json({ success: true, active: name })

  res.cookies.set('tickos-active-workspace', name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })

  return res
}
