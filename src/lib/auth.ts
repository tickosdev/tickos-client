import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SESSION_SECRET = new TextEncoder().encode(
  process.env.TICKOS_SESSION_SECRET || 'tickos-client-default-secret-change-me'
)

const COOKIE_NAME = 'tickos-session'

export interface SessionPayload {
  userId: string
  email: string
  fullName: string | null
  role: string
}

export async function createSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(SESSION_SECRET)
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET)
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      fullName: (payload.fullName as string) || null,
      role: payload.role as string,
    }
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySession(token)
}

export function getSessionCookieName(): string {
  return COOKIE_NAME
}
