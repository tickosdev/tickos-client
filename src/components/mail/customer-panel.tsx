'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { X, Copy, Check, Mail, Phone, Calendar, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { StatusBadge, getTicketStatusVariant } from '@/components/ui/status-badge'
import { CustomerDetail } from '@/lib/api-client'
import { cn } from '@/lib/utils'

interface CustomerPanelProps {
  customer: CustomerDetail | null
  isLoading: boolean
  onClose: () => void
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

export function CustomerPanel({ customer, isLoading, onClose }: CustomerPanelProps) {
  if (isLoading) {
    return (
      <div className="w-[280px] border-l flex-shrink-0 flex flex-col">
        <div className="flex items-center justify-between px-3 h-[52px] flex-shrink-0">
          <span className="text-xs font-medium">Contact</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Separator />
        <div className="flex items-center justify-center flex-1">
          <span className="text-xs text-muted-foreground font-mono">Loading...</span>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="w-[280px] border-l flex-shrink-0 flex flex-col">
        <div className="flex items-center justify-between px-3 h-[52px] flex-shrink-0">
          <span className="text-xs font-medium">Contact</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Separator />
        <div className="flex items-center justify-center flex-1">
          <span className="text-xs text-muted-foreground font-mono">Not found</span>
        </div>
      </div>
    )
  }

  const openTickets = customer.tickets?.filter(t => t.status === 'open' || t.status === 'review').length || 0
  const totalTickets = customer.tickets?.length || 0

  return (
    <div className="w-[280px] border-l flex-shrink-0 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-[52px] flex-shrink-0">
        <span className="text-xs font-medium">Contact</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Avatar + Name */}
          <div className="flex flex-col items-center text-center gap-2 py-2">
            <div className={cn(
              'h-12 w-12 rounded-full flex items-center justify-center text-sm font-semibold',
              getAvatarColor(customer.name || customer.email)
            )}>
              {getInitials(customer.name || customer.email)}
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">
                {customer.name || 'Unknown'}
              </p>
              {customer.source && (
                <span className="inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                  {customer.source}
                </span>
              )}
            </div>
          </div>

          <Separator />

          {/* Contact details */}
          <div className="space-y-2.5">
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

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground flex-shrink-0">
                <Calendar className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs text-muted-foreground">
                First contact
              </span>
              <span className="text-xs font-mono tabular-nums ml-auto">
                {format(new Date(customer.created_at), 'MMM dd, yyyy')}
              </span>
            </div>
          </div>

          <Separator />

          {/* Activity stats */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Activity
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border p-2 text-center">
                <p className="text-lg font-semibold font-mono tabular-nums">{totalTickets}</p>
                <p className="text-[10px] text-muted-foreground">Total tickets</p>
              </div>
              <div className="rounded-md border p-2 text-center">
                <p className="text-lg font-semibold font-mono tabular-nums">{openTickets}</p>
                <p className="text-[10px] text-muted-foreground">Open</p>
              </div>
            </div>
          </div>

          {/* Recent tickets */}
          {customer.tickets && customer.tickets.length > 0 && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Tickets
                </span>
                <div className="space-y-1">
                  {customer.tickets.map(t => (
                    <div
                      key={t.id}
                      className="rounded-md border p-2 space-y-1 hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <Ticket className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                          {t.client_id}
                        </span>
                        <StatusBadge variant={getTicketStatusVariant(t.status)} className="ml-auto">
                          {t.status}
                        </StatusBadge>
                      </div>
                      <p className="text-xs truncate">{t.subject}</p>
                      <p className="font-mono text-[10px] text-muted-foreground tabular-nums">
                        {format(new Date(t.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Metadata */}
          {customer.metadata && Object.keys(customer.metadata).length > 0 && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Metadata
                </span>
                <div className="space-y-1">
                  {Object.entries(customer.metadata).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-mono">{key}</span>
                      <span className="font-mono truncate ml-2">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
