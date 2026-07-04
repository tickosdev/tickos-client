"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { TooltipProvider } from "@/components/ui/tooltip"
import { WorkspaceSwitcher, type ConfiguredWorkspace } from "./workspace-switcher"
import { InboxList } from "./inbox-list"
import { TicketDisplay } from "./ticket-display"
import { TicketList } from "./ticket-list"
import { BulkActionsBar } from "./bulk-actions-bar"
import { ComposeDialog } from "./compose-dialog"
import { SplitInboxTabs } from "./split-inbox-tabs"
import { ThemeToggle } from "@/components/theme-toggle"
import { SettingsDialog } from "./settings-dialog"
import {
  Inbox as InboxType,
  Message,
  getInboxes,
  getTickets,
  getTicket,
  getTicketMessages,
  markTicketRead,
} from "@/lib/api-client"
import { useAtom } from "jotai"
import {
  selectedInboxAtom,
  selectedTicketIdAtom,
  ticketsAtom,
  inboxesAtom,
} from "@/lib/store"
import { useSplitInbox } from "@/hooks/use-split-inbox"

export function TickosClient() {
  // Global state
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

  // Loading states (para skeletons)
  const [isLoadingInboxes, setIsLoadingInboxes] = React.useState(false)
  const [isLoadingTickets, setIsLoadingTickets] = React.useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false)

  // Paginacion (scroll infinito)
  const [hasMoreTickets, setHasMoreTickets] = React.useState(false)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)

  // Workspace state
  const [workspaces, setWorkspaces] = React.useState<ConfiguredWorkspace[]>([])
  const [activeWorkspace, setActiveWorkspace] = React.useState<string | null>(null)

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

  // Load configured workspaces on mount
  React.useEffect(() => {
    loadWorkspaces()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load inboxes when active workspace changes
  React.useEffect(() => {
    if (activeWorkspace) {
      loadInboxes()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspace])

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

  // Marcar como leido al abrir un ticket (apaga el punto azul de no leido)
  React.useEffect(() => {
    if (!selectedTicketId) return
    const ticket = tickets.find(t => t.id === selectedTicketId)
    if (ticket && !ticket.is_read) {
      markTicketRead(selectedTicketId).catch(err =>
        console.error('Error marking ticket as read:', err)
      )
      setTickets(prev =>
        prev.map(t => (t.id === selectedTicketId ? { ...t, is_read: true } : t))
      )
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTicketId])

  const loadWorkspaces = async () => {
    try {
      const res = await fetch('/api/auth/workspaces/config')
      if (res.ok) {
        const data = await res.json()
        const wsList: ConfiguredWorkspace[] = (data.data || []).map((w: { name: string }) => ({
          name: w.name,
        }))
        setWorkspaces(wsList)

        // Seleccionar el primero si no hay activo
        if (wsList.length > 0 && !activeWorkspace) {
          setActiveWorkspace(wsList[0].name)
        }
      }
    } catch (error) {
      console.error('Error loading workspaces:', error)
    }
  }

  const handleSwitchWorkspace = async (name: string) => {
    try {
      await fetch('/api/auth/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      setActiveWorkspace(name)
      setSelectedInbox(null)
      setTickets([])
      setSelectedTicketId(null)
      setInboxes([])
    } catch (error) {
      console.error('Error switching workspace:', error)
    }
  }

  const loadInboxes = async () => {
    setIsLoadingInboxes(true)
    try {
      const response = await getInboxes({ limit: 100 })
      setInboxes(response.data)

      if (response.data.length > 0 && !selectedInbox) {
        setSelectedInbox(response.data[0])
      }
    } catch (error) {
      console.error('Error loading inboxes:', error)
    } finally {
      setIsLoadingInboxes(false)
    }
  }

  const loadTickets = async () => {
    if (!selectedInbox) return

    setIsLoadingTickets(true)
    try {
      const filters = getTicketFilters(selectedInbox.id)
      const response = await getTickets({
        ...filters,
        search: searchQuery || undefined,
        limit: 50,
      })
      setTickets(response.data)
      // Fallback: si el server no reporta total, asumir que hay mas si vino la pagina llena
      const total = response.pagination?.total ?? 0
      setHasMoreTickets(total > 0 ? response.data.length < total : response.data.length === 50)
    } catch (error) {
      console.error('Error loading tickets:', error)
      setTickets([])
      setHasMoreTickets(false)
    } finally {
      setIsLoadingTickets(false)
    }
  }

  // Scroll infinito: cargar la siguiente pagina y anexarla a la lista
  const loadMoreTickets = async () => {
    if (!selectedInbox || isLoadingMore || isLoadingTickets || !hasMoreTickets) return

    setIsLoadingMore(true)
    try {
      const filters = getTicketFilters(selectedInbox.id)
      const offset = tickets.length
      const response = await getTickets({
        ...filters,
        search: searchQuery || undefined,
        limit: 50,
        offset,
      })
      setTickets(prev => {
        // Evitar duplicados si el servidor repite algun ticket
        const existing = new Set(prev.map(t => t.id))
        return [...prev, ...response.data.filter(t => !existing.has(t.id))]
      })
      const total = response.pagination?.total ?? 0
      setHasMoreTickets(total > 0 ? offset + response.data.length < total : response.data.length === 50)
    } catch (error) {
      console.error('Error loading more tickets:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Abrir un ticket desde el panel de contacto: si no esta en la lista
  // actual, lo trae de la API y lo agrega para poder mostrarlo
  const handleOpenTicket = async (ticketId: string) => {
    if (!tickets.some(t => t.id === ticketId)) {
      try {
        const response = await getTicket(ticketId)
        if (response.data) {
          setTickets(prev => [response.data, ...prev])
        }
      } catch (error) {
        console.error('Error loading ticket:', error)
        return
      }
    }
    setSelectedTicketId(ticketId)
  }

  // silent: refresca sin vaciar el hilo ni mostrar skeleton (ej. tras enviar una respuesta)
  const loadMessages = async (ticketId: string, opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setIsLoadingMessages(true)
      setMessages([])
    }
    try {
      const response = await getTicketMessages(ticketId)
      setMessages(response.data)
      // Sincronizar el contador de mensajes en la lista (puede estar desactualizado)
      setTickets(prev => prev.map(t =>
        t.id === ticketId && t.message_count !== response.data.length
          ? { ...t, message_count: response.data.length }
          : t
      ))
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      if (!opts?.silent) setIsLoadingMessages(false)
    }
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
              workspaces={workspaces}
              activeWorkspace={activeWorkspace}
              onSwitch={handleSwitchWorkspace}
            />
          </div>
          <Separator />
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <InboxList
              inboxes={inboxes}
              selectedInbox={selectedInbox}
              onSelectInbox={handleSelectInbox}
              isLoading={isLoadingInboxes}
            />
            <Separator className="mx-2" />
            <SplitInboxTabs onViewChange={loadTickets} />
          </div>
          <div className="border-t py-2 flex items-center justify-center gap-1">
            <ThemeToggle />
            <SettingsDialog onWorkspacesChange={loadWorkspaces} />
          </div>
        </div>

        {/* Main content area - listado de ancho fijo + ticket display flexible */}
        <div className="flex flex-1 min-w-0">
          {/* Middle Panel - Ticket List (ancho fijo: nunca se corta la info) */}
          <div className="relative flex flex-col w-[480px] flex-shrink-0 border-r">
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
                isLoading={isLoadingTickets}
                hasMore={hasMoreTickets}
                isLoadingMore={isLoadingMore}
                onLoadMore={loadMoreTickets}
              />
            </div>

            <BulkActionsBar
              selectedIds={selectedIds}
              onClear={() => setSelectedIds(new Set())}
              onComplete={loadTickets}
            />
          </div>

          {/* Right Panel - Ticket Display */}
          <div className="flex-1 min-w-0">
            <TicketDisplay
              ticket={selectedTicket}
              messages={messages}
              isLoadingMessages={isLoadingMessages}
              onTicketUpdate={loadTickets}
              onMessageSent={() => {
                if (selectedTicketId) loadMessages(selectedTicketId, { silent: true })
              }}
              onOpenTicket={handleOpenTicket}
              onRefreshMessages={async () => {
                if (selectedTicketId) await loadMessages(selectedTicketId, { silent: true })
              }}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
