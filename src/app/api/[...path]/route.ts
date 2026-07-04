import { NextRequest, NextResponse } from 'next/server'

const TICKOS_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.tickos.dev'

function getApiKey(request: NextRequest): string {
  // Prioridad: env var > cookie
  return process.env.TICKOS_API_KEY || request.cookies.get('tickos_api_key')?.value || ''
}

async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
  method: string
) {
  try {
    const apiKey = getApiKey(request)

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Go to /setup to configure.' },
        { status: 401 }
      )
    }

    const { path: pathArray } = await params
    const path = pathArray.join('/')
    const searchParams = request.nextUrl.searchParams
    const queryString = searchParams.toString()

    const url = `${TICKOS_API_URL}/api/v1/${path}${queryString ? `?${queryString}` : ''}`

    const headers: Record<string, string> = {
      'Authorization': apiKey,
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
