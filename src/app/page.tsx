import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { TickosClient } from '@/components/mail/tickos-client'

export default async function HomePage() {
  const cookieStore = await cookies()

  // API key: env var o cookie (configurada desde /setup)
  const apiKey = process.env.TICKOS_API_KEY || cookieStore.get('tickos_api_key')?.value

  if (!apiKey) {
    redirect('/setup')
  }

  // Layout preferences
  const layout = cookieStore.get('react-resizable-panels:layout:tickos')
  const defaultLayout = layout ? JSON.parse(layout.value) : undefined

  return (
    <>
      <div className="md:hidden">
        <div className="flex h-screen items-center justify-center p-4">
          <p className="text-center text-xs text-muted-foreground font-mono">
            TickOS Client requires a desktop browser.
          </p>
        </div>
      </div>
      <div className="hidden h-screen flex-col md:flex">
        <TickosClient defaultLayout={defaultLayout} />
      </div>
    </>
  )
}
