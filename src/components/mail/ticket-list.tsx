'use client'

import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Ticket } from '@/lib/api-client'

interface TicketListProps {
  tickets: Ticket[]
  selectedTicketId: string | null
  onSelectTicket: (ticketId: string) => void
}

const priorityColors: Record<string, string> = {
  low: "bg-gray-500",
  normal: "bg-blue-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
}

const statusColors: Record<string, string> = {
  open: "bg-[#16a349]",
  pending: "bg-yellow-500",
  resolved: "bg-blue-500",
  closed: "bg-gray-500",
}

export function TicketList({
  tickets,
  selectedTicketId,
  onSelectTicket,
}: TicketListProps) {
  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-2 p-4 pt-0">
        {tickets.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            No tickets found
          </div>
        ) : (
          tickets.map((ticket: Ticket) => (
            <button
              key={ticket.id}
              className={cn(
                'flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all hover:bg-accent',
                selectedTicketId === ticket.id && 'bg-muted'
              )}
              onClick={() => onSelectTicket(ticket.id)}
            >
              <div className="flex w-full flex-col gap-1.5">
                {/* First row: Ticket ID + Time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-xs">{ticket.client_id}</div>
                    {!ticket.is_read && (
                      <span className="flex h-2 w-2 rounded-full bg-[#16a349]" />
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(ticket.created_at), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
                
                {/* Second row: Subject (larger) */}
                <div className="text-xs font-semibold line-clamp-1">{ticket.subject}</div>
                
                {/* Third row: Customer email */}
                <div className="text-[10px] text-muted-foreground line-clamp-1">
                  {ticket.customer?.email || ticket.customer?.name || 'Unknown customer'}
                </div>
              </div>
              
              {/* Bottom row: All badges and info */}
              <div className="flex items-center gap-1.5 flex-wrap w-full text-[10px]">
                {/* Inbox name if available */}
                {ticket.inbox?.name && (
                  <div className="text-muted-foreground font-medium">
                    📥 {ticket.inbox.name}
                  </div>
                )}
                
                <Badge
                  variant="secondary"
                  className={cn("text-[10px] text-white font-medium px-1.5 py-0.5", statusColors[ticket.status])}
                >
                  {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn("text-[10px] text-white font-medium px-1.5 py-0.5", priorityColors[ticket.priority])}
                >
                  {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                </Badge>
                
                {/* Messages count */}
                {ticket.message_count !== undefined && ticket.message_count > 0 && (
                  <div className="flex items-center gap-0.5 text-muted-foreground font-medium">
                    <span>💬</span>
                    <span>{ticket.message_count}</span>
                  </div>
                )}
                
                {/* Attachments count */}
                {ticket.attachment_count !== undefined && ticket.attachment_count > 0 && (
                  <div className="flex items-center gap-0.5 text-muted-foreground font-medium">
                    <span>📎</span>
                    <span>{ticket.attachment_count}</span>
                  </div>
                )}
                
                {/* Assigned status */}
                <div className="text-muted-foreground font-medium ml-auto">
                  {ticket.assigned_to_user?.full_name || ticket.assigned_to_user?.email || (ticket.assigned_to ? '👤 Assigned' : 'Unassigned')}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </ScrollArea>
  )
}
