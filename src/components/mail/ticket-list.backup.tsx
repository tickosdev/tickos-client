'use client'

import { ComponentProps } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Ticket } from '@/types/tickos'
import { useMail } from '@/lib/use-mail'

interface TicketListProps {
  items: Ticket[]
}

export function TicketList({
  tickets,
  selectedTicketId,
  onSelectTicket,
}: TicketListProps) {
  const items = tickets
  const [mail, setMail] = useMail()

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-2 p-4 pt-0">
        {tickets.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            No tickets found
          </div>
        ) : (
          tickets.map((item) => (
          <button
            key={item.id}
            className={cn(
              'flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent',
              selectedTicketId === item.id && 'bg-muted'
            )}
            onClick={() => onSelectTicket(item.id)}
          >
            <div className="flex w-full flex-col gap-1">
              <div className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">
                    {item.customer?.name || item.customer?.email || 'Unknown'}
                  </div>
                  {!item.is_read && (
                    <span className="flex h-2 w-2 rounded-full bg-blue-600" />
                  )}
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                  >
                    {item.client_id}
                  </Badge>
                </div>
                <div
                  className={cn(
                    'ml-auto text-xs',
                    selectedTicketId === item.id
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  {formatDistanceToNow(new Date(item.created_at), {
                    addSuffix: true,
                  })}
                </div>
              </div>
              <div className="text-xs font-medium">{item.subject}</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(item.status)}>
                {item.status}
              </Badge>
              <Badge variant={getPriorityBadgeVariant(item.priority)}>
                {item.priority}
              </Badge>
            </div>
          </button>
        ))
        )}
      </div>
    </ScrollArea>
  )
}

function getStatusBadgeVariant(
  status: string
): ComponentProps<typeof Badge>['variant'] {
  if (['open'].includes(status.toLowerCase())) {
    return 'default'
  }
  if (['resolved', 'closed'].includes(status.toLowerCase())) {
    return 'secondary'
  }
  return 'outline'
}

function getPriorityBadgeVariant(
  priority: string
): ComponentProps<typeof Badge>['variant'] {
  if (['urgent', 'high'].includes(priority.toLowerCase())) {
    return 'destructive'
  }
  return 'secondary'
}
