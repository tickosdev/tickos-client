'use client'

import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { getTicketStatusVariant, getTicketPriorityVariant, statusDotColor } from '@/components/ui/status-badge'
import { Ticket } from '@/lib/api-client'
import { Mail, MessageSquare, Paperclip } from 'lucide-react'

interface TicketListProps {
  tickets: Ticket[]
  selectedTicketId: string | null
  onSelectTicket: (ticketId: string) => void
  selectedIds?: Set<string>
  onToggleSelect?: (ticketId: string) => void
}

const priorityBorderColors: Record<string, string> = {
  urgent: 'border-l-rose-500',
  high: 'border-l-amber-500',
  medium: 'border-l-sky-500',
  normal: 'border-l-transparent',
  low: 'border-l-transparent',
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getAvatarColor(name: string | null | undefined): string {
  if (!name) return 'bg-muted text-muted-foreground'
  const colors = [
    'bg-sky-500/15 text-sky-600 dark:text-sky-400',
    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    'bg-violet-500/15 text-violet-600 dark:text-violet-400',
    'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
  ]
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

export function TicketList({
  tickets,
  selectedTicketId,
  onSelectTicket,
  selectedIds = new Set(),
  onToggleSelect,
}: TicketListProps) {
  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col">
        {tickets.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-xs text-muted-foreground font-mono">
            No tickets found
          </div>
        ) : (
          tickets.map((ticket: Ticket) => (
            <div
              key={ticket.id}
              className={cn(
                'group relative flex items-start gap-3 border-b border-border/50 px-4 py-3 cursor-pointer transition-colors border-l-2',
                priorityBorderColors[ticket.priority] || 'border-l-transparent',
                selectedTicketId === ticket.id
                  ? 'bg-accent/50'
                  : 'hover:bg-accent/30',
                selectedIds.has(ticket.id) && 'bg-primary/5'
              )}
              onClick={() => onSelectTicket(ticket.id)}
            >
              {/* Checkbox - visible en hover o si esta seleccionado */}
              <div className={cn(
                'flex-shrink-0 pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity',
                selectedIds.has(ticket.id) && 'opacity-100'
              )}>
                <Checkbox
                  checked={selectedIds.has(ticket.id)}
                  onCheckedChange={() => onToggleSelect?.(ticket.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-3.5 w-3.5"
                />
              </div>

              {/* Unread dot */}
              <div className="flex-shrink-0 pt-1.5 w-2">
                {!ticket.is_read && (
                  <span className="block h-2 w-2 rounded-full bg-primary" />
                )}
              </div>

              {/* Contenido principal */}
              <div className="flex-1 min-w-0 space-y-1">
                {/* Fila 1: client_id + subject + timestamp */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground tabular-nums flex-shrink-0">
                    {ticket.client_id}
                  </span>
                  <span className={cn(
                    'text-xs truncate flex-1',
                    !ticket.is_read ? 'font-medium text-foreground' : 'text-muted-foreground'
                  )}>
                    {ticket.subject}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground tabular-nums flex-shrink-0">
                    {formatDistanceToNow(new Date(ticket.updated_at || ticket.created_at), {
                      addSuffix: false,
                    })}
                  </span>
                </div>

                {/* Fila 2: customer + metadata */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground truncate">
                    {ticket.customer?.email || ticket.customer?.name || 'Unknown'}
                  </span>

                  <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
                    {/* Inbox */}
                    {ticket.inbox?.name && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="font-mono">{ticket.inbox.name}</span>
                      </span>
                    )}

                    {/* Mensajes */}
                    {ticket.message_count !== undefined && ticket.message_count > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground font-mono tabular-nums">
                        <MessageSquare className="h-3 w-3" />
                        {ticket.message_count}
                      </span>
                    )}

                    {/* Attachments */}
                    {ticket.attachment_count !== undefined && ticket.attachment_count > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground font-mono tabular-nums">
                        <Paperclip className="h-3 w-3" />
                        {ticket.attachment_count}
                      </span>
                    )}
                  </div>
                </div>

                {/* Fila 3: status + priority + assignee */}
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1">
                    <span className={cn('h-1.5 w-1.5 rounded-full', statusDotColor(getTicketStatusVariant(ticket.status)))} />
                    <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">{ticket.status}</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className={cn('h-1.5 w-1.5 rounded-full', statusDotColor(getTicketPriorityVariant(ticket.priority)))} />
                    <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">{ticket.priority}</span>
                  </span>

                  {/* Agente asignado */}
                  <div className="ml-auto flex-shrink-0">
                    {ticket.assigned_to_user ? (
                      <div
                        className={cn(
                          'flex items-center justify-center h-5 w-5 rounded-full text-[9px] font-medium',
                          getAvatarColor(ticket.assigned_to_user.full_name || ticket.assigned_to_user.email)
                        )}
                        title={ticket.assigned_to_user.full_name || ticket.assigned_to_user.email}
                      >
                        {getInitials(ticket.assigned_to_user.full_name || ticket.assigned_to_user.email)}
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/50 font-mono">--</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  )
}
