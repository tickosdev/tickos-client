'use client'

import * as React from 'react'
import { Inbox, Mail as MailIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Separator } from '@/components/ui/separator'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AccountSwitcher } from './account-switcher'
import { TicketDisplay } from './ticket-display'
import { TicketList } from './ticket-list'
import { Nav } from './nav'
import { Inbox as InboxType, Ticket } from '@/types/tickos'
import { useMail } from '@/lib/use-mail'

interface MailProps {
  workspaces: {
    id: string
    name: string
    account_id: string
  }[]
  inboxes: InboxType[]
  tickets: Ticket[]
  defaultLayout: number[] | undefined
  defaultCollapsed?: boolean
  navCollapsedSize: number
}

export function Mail({
  workspaces,
  inboxes,
  tickets,
  defaultLayout = [20, 32, 48],
  defaultCollapsed = false,
  navCollapsedSize,
}: MailProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)
  const [mail, setMail] = useMail()

  // Ensure data is available
  const safeInboxes = inboxes || []
  const safeTickets = tickets || []

  // Filter tickets by selected inbox
  const filteredTickets = mail.selectedInboxId
    ? safeTickets.filter((t) => t.inbox?.id === mail.selectedInboxId)
    : safeTickets

  // Get selected ticket details
  const selectedTicket = safeTickets.find((t) => t.id === mail.selected) || null

  // Generate nav links from inboxes
  const navLinks = safeInboxes.map((inbox) => ({
    title: inbox.name,
    label: safeTickets.filter((t) => t.inbox?.id === inbox.id).length.toString(),
    icon: inbox.channel_type === 'email' ? MailIcon : Inbox,
    variant: (mail.selectedInboxId === inbox.id ? 'default' : 'ghost') as 'default' | 'ghost',
    onClick: () => {
      setMail({
        ...mail,
        selectedInboxId: inbox.id,
        selected: null,
      })
    },
  }))

  // Select first inbox by default
  React.useEffect(() => {
    if (!mail.selectedInboxId && safeInboxes.length > 0) {
      setMail({
        ...mail,
        selectedInboxId: safeInboxes[0].id,
      })
    }
  }, [safeInboxes, mail, setMail])

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          document.cookie = `react-resizable-panels:layout:mail=${JSON.stringify(
            sizes
          )}`
        }}
        className="h-screen items-stretch"
      >
        <ResizablePanel
          defaultSize={defaultLayout[0]}
          collapsedSize={navCollapsedSize}
          collapsible={true}
          minSize={15}
          maxSize={20}
          onCollapse={() => {
            setIsCollapsed(true)
            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
              true
            )}`
          }}
          onResize={() => {
            setIsCollapsed(false)
            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
              false
            )}`
          }}
          className={cn(
            isCollapsed &&
              'min-w-[50px] transition-all duration-300 ease-in-out'
          )}
        >
          <div
            className={cn(
              'flex h-[52px] items-center justify-center',
              isCollapsed ? 'h-[52px]' : 'px-2'
            )}
          >
            <AccountSwitcher isCollapsed={isCollapsed} workspaces={workspaces} />
          </div>
          <Separator />
          <Nav isCollapsed={isCollapsed} links={navLinks} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          <Tabs defaultValue="all">
            <div className="flex items-center px-4 py-2">
              <h1 className="text-xl font-bold">
                {safeInboxes.find((i) => i.id === mail.selectedInboxId)?.name || 'Inbox'}
              </h1>
              <TabsList className="ml-auto">
                <TabsTrigger value="all" className="text-zinc-600 dark:text-zinc-200">
                  All tickets
                </TabsTrigger>
                <TabsTrigger value="unread" className="text-zinc-600 dark:text-zinc-200">
                  Unread
                </TabsTrigger>
              </TabsList>
            </div>
            <Separator />
            <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <form>
                <div className="relative">
                  <Input placeholder="Search..." className="pl-8" />
                </div>
              </form>
            </div>
            <TabsContent value="all" className="m-0">
              <TicketList items={filteredTickets} />
            </TabsContent>
            <TabsContent value="unread" className="m-0">
              <TicketList items={filteredTickets.filter((t) => !t.is_read)} />
            </TabsContent>
          </Tabs>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[2]} minSize={30}>
          <TicketDisplay ticket={selectedTicket} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  )
}
