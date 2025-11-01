'use client'

import { format } from 'date-fns'
import {
  Archive,
  ArchiveX,
  Clock,
  MoreVertical,
  Reply,
  Trash2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Ticket, Message } from '@/lib/api-client'

interface TicketDisplayProps {
  ticket: Ticket | null
  messages: Message[]
}

export function TicketDisplay({ ticket, messages }: TicketDisplayProps) {
  if (!ticket) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-muted-foreground">
        <p>No ticket selected</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center p-2">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Archive className="h-4 w-4" />
                <span className="sr-only">Archive</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Archive</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <ArchiveX className="h-4 w-4" />
                <span className="sr-only">Move to spam</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Move to spam</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Move to trash</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Move to trash</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Clock className="h-4 w-4" />
                <span className="sr-only">Snooze</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Snooze</TooltipContent>
          </Tooltip>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Reply className="h-4 w-4" />
                <span className="sr-only">Reply</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply</TooltipContent>
          </Tooltip>
        </div>
        <Separator orientation="vertical" className="mx-2 h-6" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Mark as unread</DropdownMenuItem>
            <DropdownMenuItem>Change status</DropdownMenuItem>
            <DropdownMenuItem>Change priority</DropdownMenuItem>
            <DropdownMenuItem>Assign to...</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Separator />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-start p-4">
          <div className="flex items-start gap-4 text-sm w-full">
            <Avatar>
              <AvatarImage alt={ticket.customer?.name || 'Customer'} />
              <AvatarFallback>
                {(ticket.customer?.name || ticket.customer?.email || 'U')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="grid gap-1 flex-1">
              <div className="flex items-center justify-between">
                <div className="font-semibold">
                  {ticket.customer?.name || ticket.customer?.email || 'Unknown Customer'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(ticket.created_at), 'PPpp')}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {ticket.customer?.email}
              </div>
              <div className="line-clamp-1 text-xs">
                Ticket: <span className="font-medium">{ticket.client_id}</span>
              </div>
              <div className="line-clamp-1 text-xs">
                Status: <span className="font-medium">{ticket.status}</span> | Priority:{' '}
                <span className="font-medium">{ticket.priority}</span>
              </div>
            </div>
          </div>
        </div>
        <Separator />
        <div className="flex-1 whitespace-pre-wrap p-4 text-sm overflow-auto">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">{ticket.subject}</h3>
            </div>
            {messages.length > 0 ? (
              messages.map((message: Message) => (
                <div
                  key={message.id}
                  className={`rounded-lg border p-4 ${
                    message.is_customer
                      ? 'bg-muted/50'
                      : 'bg-[#16a349]/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {message.is_customer ? 'C' : 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">
                        {message.from_name || message.from_email || 'Unknown'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(message.created_at), 'PPp')}
                    </span>
                  </div>
                  <div
                    className="text-sm"
                    dangerouslySetInnerHTML={{
                      __html: message.body_html || message.body_text || '',
                    }}
                  />
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No messages yet</p>
            )}
          </div>
        </div>
        <Separator className="mt-auto" />
        <div className="p-4">
          <form>
            <div className="grid gap-4">
              <Textarea
                className="p-4"
                placeholder={`Reply to ${ticket.customer?.name || 'customer'}...`}
              />
              <div className="flex items-center">
                <Label
                  htmlFor="mute"
                  className="flex items-center gap-2 text-xs font-normal"
                >
                  <span className="text-muted-foreground">Send as agent</span>
                </Label>
                <Button
                  onClick={(e) => e.preventDefault()}
                  size="sm"
                  className="ml-auto bg-tickos-green hover:bg-tickos-green-hover"
                >
                  Send
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
