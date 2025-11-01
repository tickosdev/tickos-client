// =====================================================
// API Proxy Route for TickOS Client
// =====================================================
// Proxy all requests to avoid CORS issues
// =====================================================

import { NextRequest, NextResponse } from 'next/server'

const TICKOS_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const API_KEY = process.env.TICKOS_API_KEY || ''

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params
    const path = pathArray.join('/')
    const searchParams = request.nextUrl.searchParams
    const queryString = searchParams.toString()
    
    const url = `${TICKOS_API_URL}/api/v1/${path}${queryString ? `?${queryString}` : ''}`
    
    console.log('🔵 [API Proxy] GET:', url)
    
    const response = await fetch(url, {
      headers: {
        'Authorization': API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ [API Proxy] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from TickOS API' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params
    const path = pathArray.join('/')
    const body = await request.json()
    
    const url = `${TICKOS_API_URL}/api/v1/${path}`
    
    console.log('🔵 [API Proxy] POST:', url)
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ [API Proxy] Error:', error)
    return NextResponse.json(
      { error: 'Failed to post to TickOS API' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params
    const path = pathArray.join('/')
    const body = await request.json()
    
    const url = `${TICKOS_API_URL}/api/v1/${path}`
    
    console.log('🔵 [API Proxy] PUT:', url)
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ [API Proxy] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update via TickOS API' },
      { status: 500 }
    )
  }
}
