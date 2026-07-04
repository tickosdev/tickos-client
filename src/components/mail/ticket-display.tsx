'use client'

import * as React from 'react'
import { format } from 'date-fns'
import {
  Archive,
  Clock,
  MoreVertical,
  Send,
  Trash2,
  User,
  ChevronDown,
  MessageSquare,
  StickyNote,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { StatusBadge, getTicketStatusVariant, getTicketPriorityVariant } from '@/components/ui/status-badge'
import { DirectionPill } from '@/components/ui/direction-pill'
import { Ticket, Message, CustomerDetail, updateTicketStatus, updateTicketPriority, createReply, archiveTicket, deleteTicket, markTicketUnread, getCustomer } from '@/lib/api-client'
import { SnoozePopover } from './snooze-popover'
import { DeleteDialog } from './delete-dialog'
import { CustomerPanel } from './customer-panel'
import { cn } from '@/lib/utils'

interface TicketDisplayProps {
  ticket: Ticket | null
  messages: Message[]
  onTicketUpdate?: () => void
}

const STATUS_OPTIONS = ['open', 'pending', 'review', 'resolved', 'closed'] as const
const PRIORITY_OPTIONS = ['low', 'normal', 'medium', 'high', 'urgent'] as const

export function TicketDisplay({ ticket, messages, onTicketUpdate }: TicketDisplayProps) {
  const [replyText, setReplyText] = React.useState('')
  const [replyMode, setReplyMode] = React.useState<'reply' | 'note'>('reply')
  const [isSending, setIsSending] = React.useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [showCustomerPanel, setShowCustomerPanel] = React.useState(false)
  const [customerDetail, setCustomerDetail] = React.useState<CustomerDetail | null>(null)
  const [isLoadingCustomer, setIsLoadingCustomer] = React.useState(false)

  const loadCustomer = React.useCallback(async (customerId: string, fallback?: { name: string | null; email: string | null }) => {
    setIsLoadingCustomer(true)
    try {
      const response = await getCustomer(customerId)
      setCustomerDetail(response.data)
    } catch (error) {
      console.error('Error loading customer:', error)
      // Mostrar info basica del ticket si la API falla
      if (fallback) {
        setCustomerDetail({
          id: customerId,
          account_id: '',
          name: fallback.name,
          email: fallback.email,
          phone: null,
          avatar_url: null,
          metadata: null,
          created_at: '',
          updated_at: '',
          tickets: [],
        })
      } else {
        setCustomerDetail(null)
      }
    } finally {
      setIsLoadingCustomer(false)
    }
  }, [])

  if (!ticket) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground font-mono">No ticket selected</p>
          <p className="text-[10px] text-muted-foreground/60 font-mono">Select a ticket from the list</p>
        </div>
      </div>
    )
  }

  const handleStatusChange = async (status: string) => {
    try {
      await updateTicketStatus(ticket.id, status as Ticket['status'])
      onTicketUpdate?.()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handlePriorityChange = async (priority: string) => {
    try {
      await updateTicketPriority(ticket.id, priority as Ticket['priority'])
      onTicketUpdate?.()
    } catch (error) {
      console.error('Error updating priority:', error)
    }
  }

  const handleArchive = async () => {
    try {
      await archiveTicket(ticket.id)
      onTicketUpdate?.()
    } catch (error) {
      console.error('Error archiving ticket:', error)
    }
  }

  const handleSendReply = async () => {
    if (!replyText.trim()) return

    setIsSending(true)
    try {
      await createReply(ticket.id, {
        body_text: replyText,
        body_html: `<p>${replyText.replace(/\n/g, '<br>')}</p>`,
        direction: replyMode === 'note' ? 'internal' : 'outbound',
      })
      setReplyText('')
      onTicketUpdate?.()
    } catch (error) {
      console.error('Error sending reply:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSendReply()
    }
  }

  return (
    <div className="flex h-full">
      {/* Main ticket content */}
      <div className="flex-1 flex flex-col min-w-0">
      {/* Action Bar */}
      <div className="flex items-center gap-1 px-4 h-[52px] flex-shrink-0">
        {/* Assignee */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs font-normal text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="font-mono text-[11px]">
                {ticket.assigned_to_user?.full_name || ticket.assigned_to_user?.email || 'Unassigned'}
              </span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem className="text-xs font-mono">Unassigned</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="text-muted-foreground/40 text-xs">·</span>

        {/* Status */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs font-normal px-1.5">
              <StatusBadge variant={getTicketStatusVariant(ticket.status)}>
                {ticket.status}
              </StatusBadge>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {STATUS_OPTIONS.map(s => (
              <DropdownMenuItem
                key={s}
                onClick={() => handleStatusChange(s)}
                className="text-xs font-mono uppercase"
              >
                {s}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="text-muted-foreground/40 text-xs">·</span>

        {/* Priority */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs font-normal px-1.5">
              <StatusBadge variant={getTicketPriorityVariant(ticket.priority)} dot={false}>
                {ticket.priority}
              </StatusBadge>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {PRIORITY_OPTIONS.map(p => (
              <DropdownMenuItem
                key={p}
                onClick={() => handlePriorityChange(p)}
                className="text-xs font-mono uppercase"
              >
                {p}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleArchive}>
                <Archive className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Archive</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <SnoozePopover ticketId={ticket.id} onComplete={onTicketUpdate}>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Clock className="h-3.5 w-3.5" />
                  </Button>
                </SnoozePopover>
              </span>
            </TooltipTrigger>
            <TooltipContent>Snooze</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-xs"
                onClick={async () => {
                  try { await markTicketUnread(ticket.id); onTicketUpdate?.() } catch {}
                }}
              >
                Mark as unread
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs"
                onClick={() => {
                  const url = `${window.location.origin}/shared/${ticket.shared_uuid}`
                  navigator.clipboard.writeText(url)
                }}
              >
                Copy public link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-xs text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete ticket
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Separator />

      {/* Ticket header */}
      <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0 min-w-0">
        <span className="font-mono text-[10px] text-muted-foreground tabular-nums flex-shrink-0">{ticket.client_id}</span>
        <h2 className="text-xs font-medium truncate">{ticket.subject}</h2>
        <span className="text-muted-foreground/40 text-xs flex-shrink-0">·</span>
        {ticket.customer?.name && (
          <>
            <span className="text-xs text-muted-foreground flex-shrink-0">{ticket.customer.name}</span>
            <span className="text-muted-foreground/40 text-xs flex-shrink-0">·</span>
          </>
        )}
        <button
          onClick={() => {
            if (showCustomerPanel) {
              setShowCustomerPanel(false)
            } else {
              setShowCustomerPanel(true)
              const cid = ticket.customer_id || ticket.customer?.id
              if (cid) {
                loadCustomer(cid, { name: ticket.customer?.name || null, email: ticket.customer?.email || null })
              }
            }
          }}
          className="text-xs text-muted-foreground hover:underline hover:text-foreground transition-colors cursor-pointer flex-shrink-0"
        >
          {ticket.customer?.email || 'Unknown'}
        </button>
        <span className="text-muted-foreground/40 text-xs flex-shrink-0">·</span>
        <span className="font-mono text-[10px] text-muted-foreground tabular-nums flex-shrink-0">
          {format(new Date(ticket.created_at), 'yyyy-MM-dd HH:mm')}
        </span>
      </div>

      <Separator />

      {/* Messages thread */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono text-center py-8">
              No messages
            </p>
          ) : (
            messages.map((message: Message) => (
              <div
                key={message.id}
                className={cn(
                  'rounded-md border p-3 space-y-2',
                  message.direction === 'inbound'
                    ? 'bg-card'
                    : message.direction === 'internal'
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : 'bg-primary/5 border-primary/20'
                )}
              >
                {/* Message header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">
                      {message.from_name || message.from_email || 'Unknown'}
                    </span>
                    <DirectionPill direction={message.direction || (message.is_customer ? 'inbound' : 'outbound')} />
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                    {format(new Date(message.created_at), 'MMM dd, HH:mm')}
                  </span>
                </div>

                {/* Message body */}
                {message.body_html ? (
                  <div
                    className="email-content-viewer rounded text-xs p-2"
                    dangerouslySetInnerHTML={{ __html: message.body_html }}
                  />
                ) : (
                  <p className="text-xs whitespace-pre-wrap text-foreground/80">
                    {message.body_text || ''}
                  </p>
                )}

                {/* Attachments */}
                {message.message_files && message.message_files.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {message.message_files.map(file => (
                      <a
                        key={file.id}
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        {file.file_name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <Separator />

      {/* Reply box */}
      <div className="flex-shrink-0 border-t">
        {/* Mode tabs */}
        <div className="flex items-center border-b">
          <button
            onClick={() => setReplyMode('reply')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-colors',
              replyMode === 'reply'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <MessageSquare className="h-3 w-3" />
            Reply
          </button>
          <button
            onClick={() => setReplyMode('note')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-colors',
              replyMode === 'note'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <StickyNote className="h-3 w-3" />
            Note
          </button>
        </div>

        {/* Textarea */}
        <div className="p-3 space-y-2">
          <Textarea
            placeholder={replyMode === 'reply'
              ? `Reply to ${ticket.customer?.name || ticket.customer?.email || 'customer'}...`
              : 'Internal note (not visible to customer)...'
            }
            className={cn(
              'min-h-[80px] text-xs resize-none',
              replyMode === 'note' && 'border-amber-500/30 bg-amber-500/5'
            )}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-mono">
              {replyMode === 'reply' ? 'Outbound' : 'Internal'} · Cmd+Enter
            </span>
            <Button
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={handleSendReply}
              disabled={!replyText.trim() || isSending}
            >
              <Send className="h-3 w-3" />
              {isSending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <DeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        ticketId={ticket.client_id}
        isDeleting={isDeleting}
        onConfirm={async () => {
          setIsDeleting(true)
          try {
            await deleteTicket(ticket.id)
            setShowDeleteDialog(false)
            onTicketUpdate?.()
          } catch (error) {
            console.error('Error deleting ticket:', error)
          } finally {
            setIsDeleting(false)
          }
        }}
      />
      </div>

      {/* Customer sidebar */}
      {showCustomerPanel && (
        <CustomerPanel
          customer={customerDetail}
          isLoading={isLoadingCustomer}
          onClose={() => setShowCustomerPanel(false)}
        />
      )}
    </div>
  )
}
