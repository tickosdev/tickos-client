import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const SERVICE_KEY = process.env.TICKOS_API_KEY || ''

export async function GET(request: NextRequest) {
  try {
    const url = new URL(`${API_BASE}/api/v1/accounts`)
    // forward query params
    for (const [k, v] of new URL(request.url).searchParams) {
      url.searchParams.set(k, v)
    }

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: SERVICE_KEY,
        'Content-Type': 'application/json',
      },
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    return NextResponse.json({ error: 'proxy error', detail: String(error) }, { status: 500 })
  }
}
