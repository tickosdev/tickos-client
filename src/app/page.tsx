import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { TickosClient } from '@/components/mail/tickos-client'

export default async function HomePage() {
  // Check for API key in environment or redirect to setup
  const apiKey = process.env.TICKOS_API_KEY
  const userEmail = process.env.TICKOS_USER_EMAIL

  if (!apiKey || !userEmail) {
    redirect('/setup')
  }

  // Get layout preferences from cookies
  const cookieStore = await cookies()
  const layout = cookieStore.get('react-resizable-panels:layout:tickos')

  const defaultLayout = layout ? JSON.parse(layout.value) : undefined

  return (
    <>
      <div className="md:hidden">
        <div className="flex h-screen items-center justify-center p-4">
          <p className="text-center text-muted-foreground">
            TickOS Client is not optimized for mobile. Please use a desktop browser.
          </p>
        </div>
      </div>
      <div className="hidden h-screen flex-col md:flex">
        <TickosClient
          defaultLayout={defaultLayout}
        />
      </div>
    </>
  )
}
