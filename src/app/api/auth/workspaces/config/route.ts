import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import {
  getWorkspaces,
  addWorkspace,
  removeWorkspace,
  validateWorkspaceConnection,
} from '@/lib/workspaces'

// GET - listar workspaces configurados (archivo + env var)
export async function GET() {
  const workspaces = getWorkspaces()

  return NextResponse.json({
    data: workspaces.map(w => ({
      name: w.name,
      url: w.url,
      key_preview: w.key.slice(0, 6) + '...' + w.key.slice(-4),
      source: w.source,
    })),
  })
}

// POST - agregar un workspace (valida contra tickos-core y auto-detecta nombre)
// Sin sesion solo se permite cuando no hay workspaces (setup inicial)
export async function POST(request: NextRequest) {
  const existing = getWorkspaces()

  if (existing.length > 0) {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
  }

  const body = await request.json().catch(() => null)
  const url = typeof body?.url === 'string' ? body.url.trim().replace(/\/+$/, '') : ''
  const key = typeof body?.key === 'string' ? body.key.trim() : ''
  const customName = typeof body?.name === 'string' ? body.name.trim() : ''

  if (!url || !key) {
    return NextResponse.json(
      { error: 'API URL and API key are required' },
      { status: 400 }
    )
  }

  if (!/^https?:\/\//.test(url)) {
    return NextResponse.json(
      { error: 'API URL must start with http:// or https://' },
      { status: 400 }
    )
  }

  // Validar conexion contra tickos-core y detectar nombre del workspace
  const detected = await validateWorkspaceConnection(url, key)
  if (!detected) {
    return NextResponse.json(
      { error: 'Could not connect. Check the API URL and that the API key is valid.' },
      { status: 422 }
    )
  }

  const name = customName || detected.name

  // Evitar duplicados exactos (misma key ya registrada)
  const duplicate = existing.find(w => w.key === key && w.url === url)
  if (duplicate) {
    return NextResponse.json(
      { error: `This API key is already configured as "${duplicate.name}"` },
      { status: 409 }
    )
  }

  addWorkspace({ name, url, key })

  return NextResponse.json({
    data: {
      name,
      url,
      key_preview: key.slice(0, 6) + '...' + key.slice(-4),
      source: 'file',
    },
  })
}

// DELETE - eliminar un workspace del archivo (los de env var no se pueden eliminar)
export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''

  if (!name) {
    return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 })
  }

  const removed = removeWorkspace(name)
  if (!removed) {
    const fromEnv = getWorkspaces().find(w => w.name === name && w.source === 'env')
    if (fromEnv) {
      return NextResponse.json(
        { error: 'This workspace is managed via TICKOS_WORKSPACES environment variable' },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
