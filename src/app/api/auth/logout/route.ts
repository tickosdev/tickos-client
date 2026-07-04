import { NextResponse } from 'next/server'
import { getSessionCookieName } from '@/lib/auth'

export async function POST() {
  const res = NextResponse.json({ success: true })
  res.cookies.set(getSessionCookieName(), '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}
