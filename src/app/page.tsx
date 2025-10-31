import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Mail } from '@/components/mail/mail'
import { createTickOSClient } from '@/lib/tickos-client'
import { Account, Inbox, Ticket } from '@/types/tickos'
import { Building2 } from 'lucide-react'

export default async function HomePage() {
  // Check for API key in environment or redirect to setup
  const apiKey = process.env.TICKOS_API_KEY
  const userEmail = process.env.TICKOS_USER_EMAIL

  if (!apiKey || !userEmail) {
    redirect('/setup')
  }

  // Initialize TickOS client
  const client = createTickOSClient(apiKey)

  // Fetch data from API with error handling
  let inboxes: Inbox[] = []
  let tickets: Ticket[] = []
  
  try {
    const results = await Promise.all([
      client.getInboxes().catch(err => {
        console.error('Failed to fetch inboxes:', err)
        return []
      }),
      client.getTickets({ limit: 100 }).catch(err => {
        console.error('Failed to fetch tickets:', err)
        return []
      }),
    ])
    inboxes = results[0]
    tickets = results[1]
  } catch (error) {
    console.error('Failed to fetch data from TickOS API:', error)
  }

  // Get layout preferences from cookies
  const cookieStore = await cookies()
  const layout = cookieStore.get('react-resizable-panels:layout:mail')
  const collapsed = cookieStore.get('react-resizable-panels:collapsed')

  const defaultLayout = layout ? JSON.parse(layout.value) : undefined
  const defaultCollapsed = collapsed ? JSON.parse(collapsed.value) : undefined

  // Extract unique workspaces from inboxes
  // Group by account_id and use the first 3 chars of account_id as display name
  const workspaces = Array.from(
    new Map(
      inboxes.map((inbox) => [
        inbox.account_id,
        {
          id: inbox.account_id,
          name: `Account ${inbox.account_id.substring(4, 8).toUpperCase()}`, // Show last 4 chars of account_id
          account_id: inbox.account_id,
        },
      ])
    ).values()
  )

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
        <Mail
          workspaces={workspaces}
          inboxes={inboxes}
          tickets={tickets}
          defaultLayout={defaultLayout}
          defaultCollapsed={defaultCollapsed}
          navCollapsedSize={4}
        />
      </div>
    </>
  )
}
