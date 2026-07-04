import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getWorkspaces } from '@/lib/workspaces'

export async function GET() {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const workspaces = getWorkspaces()

  return NextResponse.json({
    user: {
      id: session.userId,
      email: session.email,
      full_name: session.fullName,
      role: session.role,
    },
    workspaces: workspaces.map(w => w.name),
  })
}
