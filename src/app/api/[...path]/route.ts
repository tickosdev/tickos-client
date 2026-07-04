import { NextRequest, NextResponse } from 'next/server'
import { getWorkspaces } from '@/lib/workspaces'

function getActiveWorkspace(request: NextRequest) {
  const workspaces = getWorkspaces()
  if (workspaces.length === 0) return null

  // Leer workspace activo de cookie (si hay multi-workspace)
  const activeWorkspaceName = request.cookies.get('tickos-active-workspace')?.value

  if (activeWorkspaceName) {
    const found = workspaces.find(w => w.name === activeWorkspaceName)
    if (found) return found
  }

  // Default: primer workspace
  return workspaces[0]
}

async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
  method: string
) {
  try {
    const workspace = getActiveWorkspace(request)

    if (!workspace) {
      return NextResponse.json(
        { error: 'No workspace configured. Add a workspace from the setup wizard or Settings.' },
        { status: 401 }
      )
    }

    const { path: pathArray } = await params
    const path = pathArray.join('/')
    const searchParams = request.nextUrl.searchParams
    const queryString = searchParams.toString()

    const url = `${workspace.url}/api/v1/${path}${queryString ? `?${queryString}` : ''}`

    const headers: Record<string, string> = {
      'Authorization': workspace.key,
      'Content-Type': 'application/json',
    }

    const fetchOptions: RequestInit = { method, headers }

    if (method !== 'GET' && method !== 'DELETE') {
      const body = await request.json().catch(() => null)
      if (body) {
        fetchOptions.body = JSON.stringify(body)
      }
    }

    console.log(`[Proxy] ${method} ${url}`)

    const response = await fetch(url, fetchOptions)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Proxy] ${method} ${url} -> ${response.status}:`, errorText)
      try {
        const errorJson = JSON.parse(errorText)
        return NextResponse.json(errorJson, { status: response.status })
      } catch {
        return NextResponse.json({ error: errorText || 'Unknown error' }, { status: response.status })
      }
    }

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error(`[Proxy] ${method} error:`, error)
    return NextResponse.json(
      { error: 'Failed to proxy request to TickOS API' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'PUT')
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'PATCH')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'DELETE')
}
