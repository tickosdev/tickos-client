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
  ExternalLink,
  Paperclip,
  Download,
  Maximize2,
  RefreshCw,
  X,
  FileText,
  FileSpreadsheet,
  FileJson,
  FileArchive,
  File as FileIcon,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Ticket, Message, CustomerDetail, User as AgentUser, updateTicketStatus, updateTicketPriority, createReply, archiveTicket, deleteTicket, markTicketUnread, getCustomer, getUsers, assignTicket, unassignTicket } from '@/lib/api-client'
import { SnoozePopover } from './snooze-popover'
import { DeleteDialog } from './delete-dialog'
import { CustomerPanel } from './customer-panel'
import { cn } from '@/lib/utils'

interface TicketDisplayProps {
  ticket: Ticket | null
  messages: Message[]
  isLoadingMessages?: boolean
  onTicketUpdate?: () => void
  onMessageSent?: () => void
  onOpenTicket?: (ticketId: string) => void
  onRefreshMessages?: () => Promise<void> | void
}

const STATUS_OPTIONS = ['open', 'pending', 'review', 'resolved', 'closed'] as const
const PRIORITY_OPTIONS = ['low', 'normal', 'medium', 'high', 'urgent'] as const

// Detecta si un adjunto es una imagen (por MIME type o extension)
function isImageFile(file: { file_type: string; file_name: string }): boolean {
  if (file.file_type?.startsWith('image/')) return true
  return /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(file.file_name)
}

function formatFileSize(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Visual por tipo de documento: icono + etiqueta + colores
function getDocVisual(fileName: string): { icon: React.ReactNode; label: string; classes: string } {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  switch (ext) {
    case 'pdf':
      return { icon: <FileText className="h-4 w-4" />, label: 'PDF', classes: 'bg-red-500/15 text-red-500' }
    case 'xls':
    case 'xlsx':
    case 'csv':
      return { icon: <FileSpreadsheet className="h-4 w-4" />, label: ext.toUpperCase(), classes: 'bg-emerald-500/15 text-emerald-500' }
    case 'doc':
    case 'docx':
      return { icon: <FileText className="h-4 w-4" />, label: ext.toUpperCase(), classes: 'bg-sky-500/15 text-sky-500' }
    case 'json':
      return { icon: <FileJson className="h-4 w-4" />, label: 'JSON', classes: 'bg-amber-500/15 text-amber-500' }
    case 'zip':
    case 'rar':
    case '7z':
      return { icon: <FileArchive className="h-4 w-4" />, label: ext.toUpperCase(), classes: 'bg-violet-500/15 text-violet-500' }
    default:
      return { icon: <FileIcon className="h-4 w-4" />, label: ext ? ext.toUpperCase() : 'FILE', classes: 'bg-muted text-muted-foreground' }
  }
}

// Convierte un File a base64 (sin el prefijo data:...)
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] || '')
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function TicketDisplay({ ticket, messages, isLoadingMessages, onTicketUpdate, onMessageSent, onOpenTicket, onRefreshMessages }: TicketDisplayProps) {
  const [replyText, setReplyText] = React.useState('')
  const [replyMode, setReplyMode] = React.useState<'reply' | 'note'>('reply')
  const [isSending, setIsSending] = React.useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [showCustomerPanel, setShowCustomerPanel] = React.useState(false)
  const [customerDetail, setCustomerDetail] = React.useState<CustomerDetail | null>(null)
  const [isLoadingCustomer, setIsLoadingCustomer] = React.useState(false)
  const [previewImage, setPreviewImage] = React.useState<{ url: string; name: string } | null>(null)
  const [pendingFiles, setPendingFiles] = React.useState<File[]>([])
  const [isDragging, setIsDragging] = React.useState(false)
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [agents, setAgents] = React.useState<AgentUser[]>([])
  const [agentsLoaded, setAgentsLoaded] = React.useState(false)

  // Cargar agentes al abrir el combo de asignacion (una sola vez)
  const loadAgents = React.useCallback(async () => {
    if (agentsLoaded) return
    try {
      const response = await getUsers()
      setAgents(response.data || [])
      setAgentsLoaded(true)
    } catch (error) {
      console.error('Error loading agents:', error)
    }
  }, [agentsLoaded])

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
    if (!replyText.trim() && pendingFiles.length === 0) return

    setIsSending(true)
    try {
      // Convertir archivos pendientes a base64 para la API
      const attachments = await Promise.all(
        pendingFiles.map(async file => ({
          fileName: file.name,
          fileData: await fileToBase64(file),
          contentType: file.type || 'application/octet-stream',
        }))
      )

      await createReply(ticket.id, {
        body_text: replyText,
        body_html: `<p>${replyText.replace(/\n/g, '<br>')}</p>`,
        direction: replyMode === 'note' ? 'internal' : 'outbound',
        ...(attachments.length > 0 && { attachments }),
      })
      setReplyText('')
      setPendingFiles([])
      setIsExpanded(false)
      onMessageSent?.()
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

  const addFiles = (files: FileList | File[]) => {
    setPendingFiles(prev => [...prev, ...Array.from(files)])
  }

  const removeFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
    }
  }

  return (
    <div className="relative flex h-full overflow-hidden">
      {/* Main ticket content */}
      <div className="flex-1 flex flex-col min-w-0">
      {/* Action Bar */}
      <div className="flex items-center gap-1 px-4 h-[52px] flex-shrink-0">
        {/* Assignee */}
        <DropdownMenu onOpenChange={(open) => { if (open) loadAgents() }}>
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
            <DropdownMenuItem
              className="text-xs"
              onClick={async () => {
                try {
                  await unassignTicket(ticket.id)
                  onTicketUpdate?.()
                } catch (error) {
                  console.error('Error unassigning ticket:', error)
                }
              }}
            >
              <span className={cn('font-mono', !ticket.assigned_to && 'font-medium')}>
                Unassigned
              </span>
            </DropdownMenuItem>
            {!agentsLoaded && (
              <DropdownMenuItem disabled className="text-xs font-mono text-muted-foreground">
                Loading agents...
              </DropdownMenuItem>
            )}
            {agents.length > 0 && <DropdownMenuSeparator />}
            {agents.map(agent => (
              <DropdownMenuItem
                key={agent.id}
                className="text-xs gap-2"
                onClick={async () => {
                  try {
                    await assignTicket(ticket.id, agent.id)
                    onTicketUpdate?.()
                  } catch (error) {
                    console.error('Error assigning ticket:', error)
                  }
                }}
              >
                <span className="h-4 w-4 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[8px] font-semibold flex-shrink-0">
                  {(agent.full_name || agent.email).slice(0, 2).toUpperCase()}
                </span>
                <span className={cn(ticket.assigned_to === agent.id && 'font-medium')}>
                  {agent.full_name || agent.email}
                </span>
              </DropdownMenuItem>
            ))}
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
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={isRefreshing}
                onClick={async () => {
                  setIsRefreshing(true)
                  try {
                    await onRefreshMessages?.()
                  } finally {
                    setIsRefreshing(false)
                  }
                }}
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh messages</TooltipContent>
          </Tooltip>

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
          {isLoadingMessages ? (
            // Skeleton mientras cargan los mensajes
            [0, 1, 2].map(i => (
              <div key={i} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-4 w-16 rounded-sm" />
                  </div>
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))
          ) : messages.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono text-center py-8">
              No messages
            </p>
          ) : (
            messages.map((message: Message) => (
              <div
                key={message.id}
                className={cn(
                  'rounded-md border p-3 space-y-2 border-l-2',
                  message.direction === 'inbound'
                    ? 'bg-muted/50 border-l-border'
                    : message.direction === 'internal'
                    ? 'bg-amber-500/10 border-amber-500/30 border-l-amber-500'
                    : 'bg-emerald-500/10 border-emerald-500/30 border-l-emerald-500'
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

                {/* Message body: caja blanca con borde interno (como produccion) */}
                {message.body_html ? (
                  <div
                    className="email-content-viewer rounded-md border border-black/10 text-xs p-2.5"
                    dangerouslySetInnerHTML={{ __html: message.body_html }}
                  />
                ) : (
                  <p className="rounded-md border border-black/10 bg-white text-neutral-800 text-xs whitespace-pre-wrap p-2.5">
                    {message.body_text || ''}
                  </p>
                )}

                {/* Attachments */}
                {message.message_files && message.message_files.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {message.message_files.map(file => (
                      isImageFile(file) ? (
                        <button
                          key={file.id}
                          type="button"
                          onClick={() => setPreviewImage({ url: file.file_url, name: file.file_name })}
                          className="group relative rounded-md border overflow-hidden hover:ring-2 hover:ring-primary/50 transition-shadow"
                          title={file.file_name}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={file.file_url}
                            alt={file.file_name}
                            className="h-20 w-20 object-cover"
                            loading="lazy"
                          />
                          <span className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 font-mono text-[9px] text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                            {file.file_name}
                          </span>
                        </button>
                      ) : (
                        (() => {
                          const visual = getDocVisual(file.file_name)
                          return (
                            <a
                              key={file.id}
                              href={file.file_url}
                              download={file.file_name}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Download ${file.file_name}`}
                              className="group flex items-center gap-2.5 rounded-md border p-2 w-60 hover:bg-accent/50 hover:border-accent-foreground/20 transition-colors"
                            >
                              <span className={cn(
                                'h-9 w-9 rounded-md flex items-center justify-center flex-shrink-0',
                                visual.classes
                              )}>
                                {visual.icon}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-xs font-medium truncate">{file.file_name}</span>
                                <span className="block font-mono text-[10px] text-muted-foreground">
                                  {visual.label}{file.file_size ? ` · ${formatFileSize(file.file_size)}` : ''}
                                </span>
                              </span>
                              <Download className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </a>
                          )
                        })()
                      )
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

        {/* Textarea con soporte de drag & drop */}
        <div
          className="p-3 space-y-2"
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={(e) => { if (e.currentTarget === e.target) setIsDragging(false) }}
          onDrop={handleDrop}
        >
          <div className="relative">
            <Textarea
              placeholder={replyMode === 'reply'
                ? `Reply to ${ticket.customer?.name || ticket.customer?.email || 'customer'}...`
                : 'Internal note (not visible to customer)...'
              }
              className={cn(
                'min-h-[80px] text-xs resize-none',
                replyMode === 'note' && 'border-amber-500/30 bg-amber-500/5',
                isDragging && 'border-primary border-dashed bg-primary/5'
              )}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-md bg-background/70">
                <span className="text-xs font-mono text-primary">Drop files to attach</span>
              </div>
            )}
          </div>

          {/* Archivos pendientes de adjuntar */}
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {pendingFiles.map((file, index) => (
                <span
                  key={`${file.name}-${index}`}
                  className="inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                >
                  <Paperclip className="h-2.5 w-2.5" />
                  <span className="max-w-[140px] truncate">{file.name}</span>
                  <span className="text-muted-foreground/60">{formatFileSize(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="hover:text-foreground transition-colors"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files)
                  e.target.value = ''
                }}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach files</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setIsExpanded(true)}
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Expand editor</TooltipContent>
              </Tooltip>
              <span className="text-[10px] text-muted-foreground font-mono ml-1">
                {replyMode === 'reply' ? 'Outbound' : 'Internal'} · Cmd+Enter
              </span>
            </div>
            <Button
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={handleSendReply}
              disabled={(!replyText.trim() && pendingFiles.length === 0) || isSending}
            >
              <Send className="h-3 w-3" />
              {isSending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </div>

      {/* Editor expandido (popup para escribir comodo) */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent
          className="max-w-3xl gap-3"
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <DialogTitle className="flex items-center gap-2 text-sm">
            {replyMode === 'reply' ? (
              <>
                <MessageSquare className="h-3.5 w-3.5" />
                Reply to {ticket.customer?.name || ticket.customer?.email || 'customer'}
              </>
            ) : (
              <>
                <StickyNote className="h-3.5 w-3.5 text-amber-500" />
                Internal note
              </>
            )}
          </DialogTitle>
          <Textarea
            autoFocus
            placeholder={replyMode === 'reply' ? 'Write your reply...' : 'Internal note (not visible to customer)...'}
            className={cn(
              'min-h-[45vh] text-sm resize-none',
              replyMode === 'note' && 'border-amber-500/30 bg-amber-500/5',
              isDragging && 'border-primary border-dashed bg-primary/5'
            )}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {pendingFiles.map((file, index) => (
                <span
                  key={`${file.name}-${index}`}
                  className="inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                >
                  <Paperclip className="h-2.5 w-2.5" />
                  <span className="max-w-[180px] truncate">{file.name}</span>
                  <span className="text-muted-foreground/60">{formatFileSize(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="hover:text-foreground transition-colors"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[10px] text-muted-foreground font-mono">
                {replyMode === 'reply' ? 'Outbound' : 'Internal'} · Cmd+Enter · Drag files here
              </span>
            </div>
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={handleSendReply}
              disabled={(!replyText.trim() && pendingFiles.length === 0) || isSending}
            >
              <Send className="h-3 w-3" />
              {isSending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Visor de imagenes (lightbox) */}
      <Dialog open={!!previewImage} onOpenChange={open => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-2 gap-2">
          <div className="flex items-center justify-between pr-8 pl-1 pt-1">
            <DialogTitle className="font-mono text-xs font-medium truncate">
              {previewImage?.name}
            </DialogTitle>
            {previewImage && (
              <a
                href={previewImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                <ExternalLink className="h-3 w-3" />
                Open original
              </a>
            )}
          </div>
          {previewImage && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={previewImage.url}
              alt={previewImage.name}
              className="max-h-[80vh] w-full object-contain rounded-md bg-muted/30"
            />
          )}
        </DialogContent>
      </Dialog>

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

      {/* Customer panel (flotante sobre el contenido) */}
      {showCustomerPanel && (
        <CustomerPanel
          customer={customerDetail}
          isLoading={isLoadingCustomer}
          onClose={() => setShowCustomerPanel(false)}
          onSelectTicket={(ticketId) => {
            setShowCustomerPanel(false)
            onOpenTicket?.(ticketId)
          }}
        />
      )}
    </div>
  )
}
