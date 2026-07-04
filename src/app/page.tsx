import { redirect } from 'next/navigation'
import { TickosClient } from '@/components/mail/tickos-client'
import { getWorkspaces } from '@/lib/workspaces'

export default async function HomePage() {
  // Si no hay workspaces configurados, redirigir a login/setup
  const workspaces = getWorkspaces()
  if (workspaces.length === 0) {
    redirect('/login')
  }

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
        <TickosClient />
      </div>
    </>
  )
}
