"use client"

import * as React from "react"
import { HiInbox, HiArchive, HiCheckCircle, HiSearch, HiOfficeBuilding } from "react-icons/hi"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Separator } from "@/components/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { WorkspaceSwitcher } from "./workspace-switcher"
import { InboxList } from "./inbox-list"
import { TicketDisplay } from "./ticket-display"
import { TicketList } from "./ticket-list"
import { Nav } from "./nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { Account, Inbox, Ticket, Message, apiClient } from "@/lib/api-client"
import { useAtom } from "jotai"
import {
  selectedAccountAtom,
  selectedInboxAtom,
  selectedTicketIdAtom,
  ticketsAtom,
  inboxesAtom,
  accountsAtom,
} from "@/lib/store"

interface TickosClientProps {
  defaultLayout?: number[] | undefined
}

export function TickosClient({
  defaultLayout = [20, 32, 48],
}: TickosClientProps) {
  // Global state
  const [accounts, setAccounts] = useAtom(accountsAtom)
  const [selectedAccount, setSelectedAccount] = useAtom(selectedAccountAtom)
  const [inboxes, setInboxes] = useAtom(inboxesAtom)
  const [selectedInbox, setSelectedInbox] = useAtom(selectedInboxAtom)
  const [tickets, setTickets] = useAtom(ticketsAtom)
  const [selectedTicketId, setSelectedTicketId] = useAtom(selectedTicketIdAtom)
  
  // Local state
  const [messages, setMessages] = React.useState<Message[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'resolved'>('all')

  // Load accounts on mount
  React.useEffect(() => {
    loadAccounts()
  }, [])

  // Load inboxes when account changes
  React.useEffect(() => {
    if (selectedAccount) {
      loadInboxes()
    }
  }, [selectedAccount])

  // Load tickets when inbox changes
  React.useEffect(() => {
    if (selectedInbox) {
      loadTickets()
    }
  }, [selectedInbox, filter])

  // Load messages when ticket changes
  React.useEffect(() => {
    if (selectedTicketId) {
      loadMessages(selectedTicketId)
    }
  }, [selectedTicketId])

  const loadAccounts = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getAccounts()
      setAccounts(response.data)
      
      // Select first account by default (or current one)
      const currentAccount = response.data.find(acc => acc.is_current) || response.data[0]
      if (currentAccount) {
        setSelectedAccount(currentAccount)
      }
    } catch (error) {
      console.error('Error loading accounts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadInboxes = async () => {
    try {
      console.log('🔵 Loading inboxes...')
      const response = await apiClient.getInboxes({ limit: 100 })
      console.log('✅ Inboxes loaded:', response.data.length)
      setInboxes(response.data)
      
      // Select first inbox by default
      if (response.data.length > 0 && !selectedInbox) {
        console.log('🔵 Selecting first inbox:', response.data[0].name)
        setSelectedInbox(response.data[0])
      }
    } catch (error) {
      console.error('❌ Error loading inboxes:', error)
    }
  }

  const loadTickets = async () => {
    if (!selectedInbox) {
      console.log('⚠️ No inbox selected, skipping ticket load')
      return
    }
    
    try {
      console.log('🔵 Loading tickets for inbox:', selectedInbox.name)
      const statusParam = filter === 'pending' ? 'pending' : filter === 'resolved' ? 'resolved' : undefined
      const response = await apiClient.getTickets({
        inbox_id: selectedInbox.id,
        status: statusParam,
        limit: 50,
      })
      console.log('✅ Tickets loaded:', response.data.length)
      setTickets(response.data)
    } catch (error) {
      console.error('❌ Error loading tickets:', error)
      setTickets([])
    }
  }

  const loadMessages = async (ticketId: string) => {
    try {
      const response = await apiClient.getTicketMessages(ticketId)
      setMessages(response.data)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const handleSelectAccount = (account: Account) => {
    setSelectedAccount(account)
    setSelectedInbox(null)
    setTickets([])
    setSelectedTicketId(null)
  }

  const handleSelectInbox = (inbox: Inbox) => {
    setSelectedInbox(inbox)
    setSelectedTicketId(null)
  }

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          document.cookie = `react-resizable-panels:layout:tickos=${JSON.stringify(sizes)}`
        }}
        className="h-screen items-stretch"
      >
  {/* Left Sidebar - Inboxes */}
        <ResizablePanel
          defaultSize={3}
          minSize={3}
          maxSize={6}
        >
          {/* Workspace Switcher - Icon only */}
          <div className="flex h-[52px] items-center justify-center">
            <WorkspaceSwitcher
              accounts={accounts}
              selectedAccount={selectedAccount}
              onSelectAccount={handleSelectAccount}
              isCollapsed={true}
            />
          </div>
          <Separator />

          {/* Inbox list (vertical) */}
          <InboxList 
            inboxes={inboxes} 
            selectedInbox={selectedInbox} 
            onSelectInbox={handleSelectInbox}
            themeToggle={<ThemeToggle />}
          />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Middle Panel - Ticket List (tabs for All / Pending / Resolved) */}
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30} className="flex flex-col">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-2">
              <h1 className="text-sm font-semibold">Tickets</h1>
              <TabsList>
                <TabsTrigger value="all" className="text-zinc-600 dark:text-zinc-200">All</TabsTrigger>
                <TabsTrigger value="pending" className="text-zinc-600 dark:text-zinc-200">Pending</TabsTrigger>
                <TabsTrigger value="resolved" className="text-zinc-600 dark:text-zinc-200">Resolved</TabsTrigger>
              </TabsList>
            </div>
            <Separator />
            <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <form>
                <div className="relative">
                  <HiSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search tickets" className="pl-8" />
                </div>
              </form>
            </div>
            <TabsContent value="all" className="m-0 flex-1 overflow-hidden">
              <TicketList
                tickets={tickets}
                selectedTicketId={selectedTicketId}
                onSelectTicket={setSelectedTicketId}
              />
            </TabsContent>
            <TabsContent value="pending" className="m-0 flex-1 overflow-hidden">
              <TicketList
                tickets={tickets.filter(t => t.status === 'pending')}
                selectedTicketId={selectedTicketId}
                onSelectTicket={setSelectedTicketId}
              />
            </TabsContent>
            <TabsContent value="resolved" className="m-0 flex-1 overflow-hidden">
              <TicketList
                tickets={tickets.filter(t => t.status === 'resolved' || t.status === 'closed')}
                selectedTicketId={selectedTicketId}
                onSelectTicket={setSelectedTicketId}
              />
            </TabsContent>
          </Tabs>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Right Panel - Ticket Display */}
        <ResizablePanel defaultSize={defaultLayout[2]} minSize={30}>
          <TicketDisplay ticket={selectedTicket} messages={messages} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  )
}
