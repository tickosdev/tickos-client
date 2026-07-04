import { NextRequest, NextResponse } from 'next/server'

const TICKOS_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.tickos.dev'

export async function POST(request: NextRequest) {
  try {
    const { email, apiKey } = await request.json()

    if (!email || !apiKey) {
      return NextResponse.json(
        { error: 'Email and API key are required' },
        { status: 400 }
      )
    }

    // Validar la API key haciendo una llamada de prueba a la API de TickOS
    const testResponse = await fetch(`${TICKOS_API_URL}/api/v1/accounts`, {
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
    })

    if (!testResponse.ok) {
      const error = await testResponse.json().catch(() => ({ error: 'Invalid API key' }))
      return NextResponse.json(
        { error: error.error || 'Invalid API key. Please check and try again.' },
        { status: 401 }
      )
    }

    const accountsData = await testResponse.json()

    // Guardar en cookies HTTP-only (seguras, no accesibles desde JS del cliente)
    const response = NextResponse.json({
      success: true,
      message: 'Configuration saved',
      accounts: accountsData.data,
    })

    // Cookie con la API key (HTTP-only, secure en producción)
    response.cookies.set('tickos_api_key', apiKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 año
    })

    // Cookie con el email del usuario
    response.cookies.set('tickos_user_email', email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })

    return response
  } catch (error) {
    console.error('[Setup] Error:', error)
    return NextResponse.json(
      { error: 'Failed to validate configuration' },
      { status: 500 }
    )
  }
}

// DELETE para cerrar sesion / limpiar configuracion
export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('tickos_api_key')
  response.cookies.delete('tickos_user_email')
  return response
}
