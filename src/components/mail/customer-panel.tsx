'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { format, isValid } from 'date-fns'
import { X, Copy, Check, Mail, Phone, Calendar, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge, getTicketStatusVariant, getTicketPriorityVariant } from '@/components/ui/status-badge'
import { CustomerDetail } from '@/lib/api-client'
import { cn } from '@/lib/utils'

interface CustomerPanelProps {
  customer: CustomerDetail | null
  isLoading: boolean
  onClose: () => void
  onSelectTicket?: (ticketId: string) => void
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
    'bg-sky-500/15 text-sky-500',
    'bg-emerald-500/15 text-emerald-500',
    'bg-amber-500/15 text-amber-500',
    'bg-rose-500/15 text-rose-500',
    'bg-violet-500/15 text-violet-500',
    'bg-cyan-500/15 text-cyan-500',
  ]
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

function formatDateSafe(value: string | null | undefined, pattern: string): string | null {
  if (!value) return null
  const date = new Date(value)
  return isValid(date) ? format(date, pattern) : null
}

function CopyableField({ value, icon }: { value: string; icon: React.ReactNode }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center gap-2 group">
      <span className="text-muted-foreground flex-shrink-0">{icon}</span>
      <span className="text-xs font-mono truncate flex-1">{value}</span>
      <button
        onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-accent"
      >
        {copied
          ? <Check className="h-3 w-3 text-emerald-500" />
          : <Copy className="h-3 w-3 text-muted-foreground" />
        }
      </button>
    </div>
  )
}

// Contenedor flotante compartido por los 3 estados del panel
// Se renderiza via portal en document.body: escapa de cualquier contenedor
// con transform/overflow-hidden (ResizablePanel), asi NUNCA se corta
function PanelShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <>
      {/* Backdrop: clic fuera cierra el panel */}
      <div
        className="fixed inset-0 z-30 bg-black/20 animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-40 w-[50vw] min-w-[560px] max-w-[960px] flex flex-col border-l bg-background shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between px-4 h-[52px] flex-shrink-0">
          <span className="text-xs font-medium">Contact</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Separator />
        {children}
      </div>
    </>,
    document.body
  )
}

export function CustomerPanel({ customer, isLoading, onClose, onSelectTicket }: CustomerPanelProps) {
  if (isLoading) {
    return (
      <PanelShell onClose={onClose}>
        {/* Skeleton cabecera */}
        <div className="p-4 space-y-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-12 w-16" />
              <Skeleton className="h-12 w-16" />
              <Skeleton className="h-12 w-16" />
            </div>
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-3 w-56" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Separator />
        {/* Skeleton tickets */}
        <div className="p-3 space-y-1.5">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="rounded-md border p-2.5 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16 ml-auto" />
              </div>
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-4 w-24 rounded-sm" />
            </div>
          ))}
        </div>
      </PanelShell>
    )
  }

  if (!customer) {
    return (
      <PanelShell onClose={onClose}>
        <div className="flex items-center justify-center flex-1">
          <span className="text-xs text-muted-foreground font-mono">Not found</span>
        </div>
      </PanelShell>
    )
  }

  const displayName = customer.name?.trim() && customer.name.trim() !== '-'
    ? customer.name
    : customer.email || 'Unknown'
  const openTickets = customer.tickets?.filter(t => t.status === 'open' || t.status === 'review').length || 0
  const resolvedTickets = customer.tickets?.filter(t => t.status === 'resolved' || t.status === 'closed').length || 0
  const totalTickets = customer.tickets?.length || 0
  const firstContact = formatDateSafe(customer.created_at, 'MMM dd, yyyy')
  const showSource = customer.source && customer.source.toLowerCase() !== 'unknown'

  // Tickets mas recientes primero
  const sortedTickets = [...(customer.tickets || [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <PanelShell onClose={onClose}>
      {/* Cabecera: informacion del contacto */}
      <div className="p-4 space-y-3 flex-shrink-0">
        {/* Fila 1: avatar + nombre a la izquierda, stats a la derecha */}
        <div className="flex items-center gap-3">
          <div className={cn(
            'h-12 w-12 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0',
            getAvatarColor(displayName)
          )}>
            {getInitials(displayName)}
          </div>
          <div className="space-y-0.5 min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{displayName}</p>
            {showSource && (
              <span className="inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                {customer.source}
              </span>
            )}
          </div>
          {/* Activity stats */}
          <div className="flex gap-2 flex-shrink-0">
            <div className="rounded-md border px-3 py-1.5 text-center min-w-[60px]">
              <p className="text-base font-semibold font-mono tabular-nums leading-tight">{totalTickets}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
            <div className="rounded-md border px-3 py-1.5 text-center min-w-[60px]">
              <p className="text-base font-semibold font-mono tabular-nums leading-tight">{openTickets}</p>
              <p className="text-[10px] text-muted-foreground">Open</p>
            </div>
            <div className="rounded-md border px-3 py-1.5 text-center min-w-[60px]">
              <p className="text-base font-semibold font-mono tabular-nums leading-tight">{resolvedTickets}</p>
              <p className="text-[10px] text-muted-foreground">Solved</p>
            </div>
          </div>
        </div>

        {/* Fila 2: detalles de contacto en linea */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {customer.email && (
            <CopyableField
              value={customer.email}
              icon={<Mail className="h-3.5 w-3.5" />}
            />
          )}

          {customer.phone && (
            <CopyableField
              value={customer.phone}
              icon={<Phone className="h-3.5 w-3.5" />}
            />
          )}

          {firstContact && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground flex-shrink-0">
                <Calendar className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs text-muted-foreground">First contact</span>
              <span className="text-xs font-mono tabular-nums">{firstContact}</span>
            </div>
          )}
        </div>

        {/* Metadata */}
        {customer.metadata && Object.keys(customer.metadata).length > 0 && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            {Object.entries(customer.metadata).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground font-mono">{key}</span>
                <span className="font-mono">{String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Historial de tickets debajo, a ancho completo */}
      <div className="px-4 py-3 flex items-center justify-between flex-shrink-0">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Ticket history
        </span>
        <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
          {totalTickets}
        </span>
      </div>
      <Separator />
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-1.5">
          {sortedTickets.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono text-center py-8">
              No tickets
            </p>
          ) : (
            sortedTickets.map(t => (
              <div
                key={t.id}
                onClick={() => onSelectTicket?.(t.id)}
                className="rounded-md border p-2.5 space-y-1.5 hover:bg-accent/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Ticket className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                    {t.client_id}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground tabular-nums ml-auto">
                    {formatDateSafe(t.created_at, 'MMM dd, yyyy')}
                  </span>
                </div>
                <p className="text-xs font-medium truncate">{t.subject}</p>
                <div className="flex items-center gap-1.5">
                  <StatusBadge variant={getTicketStatusVariant(t.status)}>
                    {t.status}
                  </StatusBadge>
                  {t.priority && (
                    <StatusBadge variant={getTicketPriorityVariant(t.priority)} dot={false}>
                      {t.priority}
                    </StatusBadge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </PanelShell>
  )
}
