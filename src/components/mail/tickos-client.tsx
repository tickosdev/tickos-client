"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Separator } from "@/components/ui/separator"
import { TooltipProvider } from "@/components/ui/tooltip"
import { WorkspaceSwitcher } from "./workspace-switcher"
import { InboxList } from "./inbox-list"
import { TicketDisplay } from "./ticket-display"
import { TicketList } from "./ticket-list"
import { BulkActionsBar } from "./bulk-actions-bar"
import { ComposeDialog } from "./compose-dialog"
import { SplitInboxTabs } from "./split-inbox-tabs"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Account,
  Inbox as InboxType,
  Message,
  getAccounts,
  getInboxes,
  getTickets,
  getTicketMessages,
} from "@/lib/api-client"
import { useAtom } from "jotai"
import {
  selectedAccountAtom,
  selectedInboxAtom,
  selectedTicketIdAtom,
  ticketsAtom,
  inboxesAtom,
  accountsAtom,
} from "@/lib/store"
import { useSplitInbox } from "@/hooks/use-split-inbox"

interface TickosClientProps {
  defaultLayout?: number[] | undefined
}

export function TickosClient({
  defaultLayout = [32, 48],
}: TickosClientProps) {
  // Global state
  const [accounts, setAccounts] = useAtom(accountsAtom)
  const [selectedAccount, setSelectedAccount] = useAtom(selectedAccountAtom)
  const [inboxes, setInboxes] = useAtom(inboxesAtom)
  const [selectedInbox, setSelectedInbox] = useAtom(selectedInboxAtom)
  const [tickets, setTickets] = useAtom(ticketsAtom)
  const [selectedTicketId, setSelectedTicketId] = useAtom(selectedTicketIdAtom)

  // Split inbox
  const { activeViewId, getTicketFilters } = useSplitInbox()

  // Local state
  const [messages, setMessages] = React.useState<Message[]>([])
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())

  // Keyboard shortcuts (J/K navigation)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.key === 'j' || e.key === 'k') {
        e.preventDefault()
        const currentIndex = tickets.findIndex(t => t.id === selectedTicketId)
        const nextIndex = e.key === 'j'
          ? Math.min(currentIndex + 1, tickets.length - 1)
          : Math.max(currentIndex - 1, 0)
        if (tickets[nextIndex]) {
          setSelectedTicketId(tickets[nextIndex].id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [tickets, selectedTicketId, setSelectedTicketId])

  // Load accounts on mount
  React.useEffect(() => {
    loadAccounts()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load inboxes when account changes
  React.useEffect(() => {
    if (selectedAccount) {
      loadInboxes()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount])

  // Load tickets when inbox or active view changes
  React.useEffect(() => {
    if (selectedInbox) {
      loadTickets()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInbox, activeViewId, searchQuery])

  // Load messages when ticket changes
  React.useEffect(() => {
    if (selectedTicketId) {
      loadMessages(selectedTicketId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTicketId])

  const loadAccounts = async () => {
    try {
      const response = await getAccounts()
      setAccounts(response.data)

      const currentAccount = response.data.find(acc => acc.is_current) || response.data[0]
      if (currentAccount) {
        setSelectedAccount(currentAccount)
      }
    } catch (error) {
      console.error('Error loading accounts:', error)
    }
  }

  const loadInboxes = async () => {
    try {
      const response = await getInboxes({ limit: 100 })
      setInboxes(response.data)

      if (response.data.length > 0 && !selectedInbox) {
        setSelectedInbox(response.data[0])
      }
    } catch (error) {
      console.error('Error loading inboxes:', error)
    }
  }

  const loadTickets = async () => {
    if (!selectedInbox) return

    try {
      const filters = getTicketFilters(selectedInbox.id)
      const response = await getTickets({
        ...filters,
        search: searchQuery || undefined,
        limit: 50,
      })
      setTickets(response.data)
    } catch (error) {
      console.error('Error loading tickets:', error)
      setTickets([])
    }
  }

  const loadMessages = async (ticketId: string) => {
    try {
      const response = await getTicketMessages(ticketId)
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

  const handleSelectInbox = (inbox: InboxType) => {
    setSelectedInbox(inbox)
    setSelectedTicketId(null)
    setSelectedIds(new Set())
  }

  const handleToggleSelect = (ticketId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(ticketId)) {
        next.delete(ticketId)
      } else {
        next.add(ticketId)
      }
      return next
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadTickets()
  }

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen">
        {/* Fixed Left Sidebar */}
        <div className="w-[180px] flex-shrink-0 border-r flex flex-col">
          <div className="flex h-[52px] items-center px-3">
            <WorkspaceSwitcher
              accounts={accounts}
              selectedAccount={selectedAccount}
              onSelectAccount={handleSelectAccount}
            />
          </div>
          <Separator />
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <InboxList
              inboxes={inboxes}
              selectedInbox={selectedInbox}
              onSelectInbox={handleSelectInbox}
            />
            <Separator className="mx-2" />
            <SplitInboxTabs onViewChange={loadTickets} />
          </div>
          <div className="border-t py-2 flex items-center justify-center">
            <ThemeToggle />
          </div>
        </div>

        {/* Main content area - resizable ticket list + ticket display */}
        <ResizablePanelGroup
          direction="horizontal"
          onLayout={(sizes: number[]) => {
            document.cookie = `react-resizable-panels:layout:tickos=${JSON.stringify(sizes)}`
          }}
          className="flex-1"
        >
          {/* Middle Panel - Ticket List */}
          <ResizablePanel defaultSize={defaultLayout[0]} minSize={28} className="relative flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-[52px] flex-shrink-0">
              <div className="flex items-baseline gap-2">
                <h1 className="text-sm font-medium">Tickets</h1>
                <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                  {tickets.length}
                </span>
              </div>
              <ComposeDialog inboxes={inboxes} onSent={loadTickets} />
            </div>

            <Separator />

            {/* Search */}
            <div className="px-4 py-2 flex-shrink-0">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets..."
                    className="pl-8 h-8 text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </form>
            </div>

            {/* Ticket List */}
            <div className="flex-1 overflow-hidden">
              <TicketList
                tickets={tickets}
                selectedTicketId={selectedTicketId}
                onSelectTicket={setSelectedTicketId}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
              />
            </div>

            <BulkActionsBar
              selectedIds={selectedIds}
              onClear={() => setSelectedIds(new Set())}
              onComplete={loadTickets}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Ticket Display */}
          <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
            <TicketDisplay
              ticket={selectedTicket}
              messages={messages}
              onTicketUpdate={loadTickets}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  )
}
