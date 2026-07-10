'use client'

import * as React from 'react'
import { useAtomValue } from 'jotai'
import { ArrowLeft, Plus, X, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useSplitInbox, SplitInboxView, SplitInboxFilters } from '@/hooks/use-split-inbox'
import { getUsers, getTags, User, Tag } from '@/lib/api-client'
import { inboxesAtom } from '@/lib/store'

// ---------------------------------------------------
// Constantes
// ---------------------------------------------------

const STATUS_OPTIONS = ['open', 'pending', 'review', 'resolved', 'closed'] as const
const PRIORITY_OPTIONS = ['low', 'normal', 'medium', 'high', 'urgent'] as const

// Filtros opcionales que se agregan via "+ Add filter"
type OptionalFilterKey = 'priority' | 'assignee' | 'tag_id' | 'inbox_id' | 'read_status' | 'show_snoozed'

const OPTIONAL_FILTERS: { key: OptionalFilterKey; label: string }[] = [
  { key: 'priority', label: 'Priority' },
  { key: 'assignee', label: 'Assigned to' },
  { key: 'tag_id', label: 'Tag' },
  { key: 'inbox_id', label: 'Inbox' },
  { key: 'read_status', label: 'Read status' },
  { key: 'show_snoozed', label: 'Snoozed' },
]

// ---------------------------------------------------
// Props
// ---------------------------------------------------

interface SplitInboxSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // 'list' abre en la lista de vistas; 'create' abre directo en el editor de nueva vista
  initialScreen?: 'list' | 'create'
  onChanged?: () => void
}

// ---------------------------------------------------
// Descripcion legible de los filtros de una vista
// (estilo produccion: "is: open, review, order: newest")
// ---------------------------------------------------

function describeView(
  view: SplitInboxView,
  tags: Tag[],
  agents: User[],
  inboxes: { id: string; name: string }[]
): string {
  const f = view.filters
  const parts: string[] = []

  if (f.status && f.status.length > 0) parts.push(`is: ${f.status.join(', ')}`)
  if (f.priority && f.priority.length > 0) parts.push(`priority: ${f.priority.join(', ')}`)
  if (f.assignee) {
    if (f.assignee === 'unassigned') {
      parts.push('unassigned')
    } else {
      const agent = agents.find(a => a.id === f.assignee)
      parts.push(`assignee: ${agent?.full_name || agent?.email || '1'}`)
    }
  }
  if (f.tag_id) {
    const tag = tags.find(t => t.id === f.tag_id)
    parts.push(`tag: ${tag?.name || '1'}`)
  }
  if (f.inbox_id) {
    const inbox = inboxes.find(i => i.id === f.inbox_id)
    parts.push(`inbox: ${inbox?.name || '1'}`)
  }
  if (f.read_status === 'unread') parts.push('unread')
  if (f.read_status === 'read') parts.push('read')
  if (f.show_archived === 'only') parts.push('archived only')
  if (f.show_snoozed === 'only') parts.push('snoozed only')

  const order = `order: ${view.sort_order === 'asc' ? 'oldest' : 'newest'}`
  if (parts.length === 0) return `sort: ${view.sort_order === 'asc' ? 'oldest' : 'newest'}`
  return `${parts.join(', ')}, ${order}`
}

// ---------------------------------------------------
// Componente principal
// ---------------------------------------------------

export function SplitInboxSettings({ open, onOpenChange, initialScreen = 'list', onChanged }: SplitInboxSettingsProps) {
  const { views, createView, updateView, deleteView } = useSplitInbox()
  const inboxes = useAtomValue(inboxesAtom)

  // 'list' | 'create' | id de la vista en edicion
  const [screen, setScreen] = React.useState<string>('list')

  // Datos para selects (cargados al abrir)
  const [agents, setAgents] = React.useState<User[]>([])
  const [tags, setTags] = React.useState<Tag[]>([])
  const loadedRef = React.useRef(false)

  React.useEffect(() => {
    if (open) {
      setScreen(initialScreen === 'create' ? 'create' : 'list')
      if (!loadedRef.current) {
        loadedRef.current = true
        getUsers()
          .then(res => setAgents(res.data || []))
          .catch(err => console.error('Error loading agents:', err))
        getTags()
          .then(res => setTags(res.data || []))
          .catch(err => console.error('Error loading tags:', err))
      }
    }
  }, [open, initialScreen])

  const sortedViews = [...views].sort((a, b) => a.order - b.order)
  const editingView = views.find(v => v.id === screen)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        {screen === 'list' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-base">Split Inbox Settings</DialogTitle>
              <DialogDescription className="text-xs">
                Create custom split inbox views to organize your tickets.
              </DialogDescription>
            </DialogHeader>

            <div className="divide-y">
              {sortedViews.map(view => {
                // La vista "All" por defecto no es editable (regla del API)
                const isAll = view.is_default && view.name === 'All'
                return (
                  <button
                    key={view.id}
                    disabled={isAll}
                    onClick={() => setScreen(view.id)}
                    className={cn(
                      'w-full text-left py-3 space-y-0.5 transition-colors',
                      isAll ? 'cursor-default' : 'hover:bg-accent/30 rounded-sm px-1 -mx-1'
                    )}
                  >
                    <p className="text-sm font-medium">{view.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {describeView(view, tags, agents, inboxes)}
                    </p>
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setScreen('create')}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <Plus className="h-3.5 w-3.5" />
              New split inbox
            </button>
          </>
        ) : (
          <ViewEditor
            key={screen}
            view={screen === 'create' ? undefined : editingView}
            agents={agents}
            tags={tags}
            inboxes={inboxes}
            onBack={() => setScreen('list')}
            onSave={async (name, filters, sortOrder) => {
              // Esperar la respuesta del API antes de refrescar contadores
              if (screen === 'create') {
                await createView(name, filters, sortOrder)
              } else if (editingView) {
                await updateView(editingView.id, { name, filters, sort_order: sortOrder })
              }
              setScreen('list')
              onChanged?.()
            }}
            onDelete={
              screen !== 'create' && editingView && !(editingView.is_default && editingView.name === 'All')
                ? async () => {
                    await deleteView(editingView.id)
                    setScreen('list')
                    onChanged?.()
                  }
                : undefined
            }
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------
// Editor de vista (crear / editar)
// ---------------------------------------------------

function ViewEditor({
  view,
  agents,
  tags,
  inboxes,
  onBack,
  onSave,
  onDelete,
}: {
  view?: SplitInboxView
  agents: User[]
  tags: Tag[]
  inboxes: { id: string; name: string }[]
  onBack: () => void
  onSave: (name: string, filters: SplitInboxFilters, sortOrder: 'desc' | 'asc') => void
  onDelete?: () => void
}) {
  const [name, setName] = React.useState(view?.name || '')
  const [status, setStatus] = React.useState<string[]>(view?.filters.status || [])
  const [archived, setArchived] = React.useState<string>(
    view?.filters.show_archived === 'only' ? 'only'
    : view?.filters.show_archived === 'exclude' || view?.filters.show_archived === false ? 'exclude'
    : 'all'
  )
  const [sortOrder, setSortOrder] = React.useState<'desc' | 'asc'>(view?.sort_order || 'desc')

  // Filtros opcionales activos y sus valores
  const initialOptional: Partial<Record<OptionalFilterKey, string | string[]>> = {}
  if (view?.filters.priority?.length) initialOptional.priority = view.filters.priority
  if (view?.filters.assignee) initialOptional.assignee = view.filters.assignee
  if (view?.filters.tag_id) initialOptional.tag_id = view.filters.tag_id
  if (view?.filters.inbox_id) initialOptional.inbox_id = view.filters.inbox_id
  if (view?.filters.read_status && view.filters.read_status !== 'all') initialOptional.read_status = view.filters.read_status
  if (view?.filters.show_snoozed) initialOptional.show_snoozed = view.filters.show_snoozed

  const [optional, setOptional] = React.useState(initialOptional)

  const activeOptionalKeys = Object.keys(optional) as OptionalFilterKey[]
  const availableFilters = OPTIONAL_FILTERS.filter(f => !activeOptionalKeys.includes(f.key))

  const setOptionalValue = (key: OptionalFilterKey, value: string | string[]) => {
    setOptional(prev => ({ ...prev, [key]: value }))
  }

  const removeOptional = (key: OptionalFilterKey) => {
    setOptional(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const toggleStatus = (s: string) => {
    setStatus(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const togglePriority = (p: string) => {
    const current = (optional.priority as string[]) || []
    const next = current.includes(p) ? current.filter(x => x !== p) : [...current, p]
    setOptionalValue('priority', next)
  }

  const handleSave = () => {
    if (!name.trim()) return

    const filters: SplitInboxFilters = {}
    if (status.length > 0) filters.status = status
    if (archived === 'only') filters.show_archived = 'only'
    else if (archived === 'exclude') filters.show_archived = 'exclude'

    const priority = optional.priority as string[] | undefined
    if (priority && priority.length > 0) filters.priority = priority
    if (optional.assignee) filters.assignee = optional.assignee as string
    if (optional.tag_id) filters.tag_id = optional.tag_id as string
    if (optional.inbox_id) filters.inbox_id = optional.inbox_id as string
    if (optional.read_status) filters.read_status = optional.read_status as 'read' | 'unread'
    if (optional.show_snoozed) filters.show_snoozed = optional.show_snoozed as 'exclude' | 'include' | 'only'

    onSave(name.trim(), filters, sortOrder)
  }

  return (
    <>
      <DialogHeader>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to split inbox settings
        </button>
        <DialogTitle className="text-base pt-1">
          {view ? view.name : 'New split inbox'}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {/* Nombre */}
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
            Name
          </Label>
          <Input
            placeholder="View name"
            className="h-8 text-xs"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus={!view}
          />
        </div>

        {/* Status (chips multi-select) */}
        <FilterRow label="Status" prefix="is">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => toggleStatus(s)}
                className={cn(
                  'rounded-md border px-2.5 py-1 text-xs capitalize transition-colors',
                  status.includes(s)
                    ? 'bg-accent border-foreground/30 font-medium'
                    : 'text-muted-foreground hover:bg-accent/50'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </FilterRow>

        {/* Archived */}
        <FilterRow label="Archived" prefix="is">
          <Select value={archived} onValueChange={setArchived}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All</SelectItem>
              <SelectItem value="exclude" className="text-xs">Not archived</SelectItem>
              <SelectItem value="only" className="text-xs">Only archived</SelectItem>
            </SelectContent>
          </Select>
        </FilterRow>

        {/* Filtros opcionales activos */}
        {activeOptionalKeys.includes('priority') && (
          <FilterRow label="Priority" prefix="is" onRemove={() => removeOptional('priority')}>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITY_OPTIONS.map(p => (
                <button
                  key={p}
                  onClick={() => togglePriority(p)}
                  className={cn(
                    'rounded-md border px-2.5 py-1 text-xs capitalize transition-colors',
                    ((optional.priority as string[]) || []).includes(p)
                      ? 'bg-accent border-foreground/30 font-medium'
                      : 'text-muted-foreground hover:bg-accent/50'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </FilterRow>
        )}

        {activeOptionalKeys.includes('assignee') && (
          <FilterRow label="Assigned to" prefix="is" onRemove={() => removeOptional('assignee')}>
            <Select
              value={(optional.assignee as string) || ''}
              onValueChange={(v) => setOptionalValue('assignee', v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select agent..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned" className="text-xs">Unassigned</SelectItem>
                {agents.map(a => (
                  <SelectItem key={a.id} value={a.id} className="text-xs">
                    {a.full_name || a.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterRow>
        )}

        {activeOptionalKeys.includes('tag_id') && (
          <FilterRow label="Tag" prefix="is" onRemove={() => removeOptional('tag_id')}>
            <Select
              value={(optional.tag_id as string) || ''}
              onValueChange={(v) => setOptionalValue('tag_id', v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select tag..." />
              </SelectTrigger>
              <SelectContent>
                {tags.length === 0 ? (
                  <SelectItem value="__none" disabled className="text-xs">No tags</SelectItem>
                ) : (
                  tags.map(t => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">
                      {t.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </FilterRow>
        )}

        {activeOptionalKeys.includes('inbox_id') && (
          <FilterRow label="Inbox" prefix="is" onRemove={() => removeOptional('inbox_id')}>
            <Select
              value={(optional.inbox_id as string) || ''}
              onValueChange={(v) => setOptionalValue('inbox_id', v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select inbox..." />
              </SelectTrigger>
              <SelectContent>
                {inboxes.map(i => (
                  <SelectItem key={i.id} value={i.id} className="text-xs">
                    {i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterRow>
        )}

        {activeOptionalKeys.includes('read_status') && (
          <FilterRow label="Read status" prefix="is" onRemove={() => removeOptional('read_status')}>
            <Select
              value={(optional.read_status as string) || ''}
              onValueChange={(v) => setOptionalValue('read_status', v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unread" className="text-xs">Unread</SelectItem>
                <SelectItem value="read" className="text-xs">Read</SelectItem>
              </SelectContent>
            </Select>
          </FilterRow>
        )}

        {activeOptionalKeys.includes('show_snoozed') && (
          <FilterRow label="Snoozed" prefix="is" onRemove={() => removeOptional('show_snoozed')}>
            <Select
              value={(optional.show_snoozed as string) || ''}
              onValueChange={(v) => setOptionalValue('show_snoozed', v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exclude" className="text-xs">Hide snoozed</SelectItem>
                <SelectItem value="include" className="text-xs">Include snoozed</SelectItem>
                <SelectItem value="only" className="text-xs">Only snoozed</SelectItem>
              </SelectContent>
            </Select>
          </FilterRow>
        )}

        {/* + Add filter */}
        {availableFilters.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-md border border-dashed px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors">
                <Plus className="h-3 w-3" />
                Add filter
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {availableFilters.map(f => (
                <DropdownMenuItem
                  key={f.key}
                  className="text-xs"
                  onClick={() => {
                    // Valor inicial por tipo de filtro
                    if (f.key === 'priority') setOptionalValue('priority', [])
                    else setOptionalValue(f.key, '')
                  }}
                >
                  {f.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Order by */}
        <div className="space-y-1.5 pt-2 border-t">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
            Order by
          </Label>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'desc' | 'asc')}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc" className="text-xs">Newest first</SelectItem>
              <SelectItem value="asc" className="text-xs">Oldest first</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 pt-2">
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={onBack}>
              Cancel
            </Button>
            <Button size="sm" className="h-7 text-[11px]" onClick={handleSave} disabled={!name.trim()}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------
// Fila de filtro: label + "is" + control + boton de quitar
// ---------------------------------------------------

function FilterRow({
  label,
  prefix,
  onRemove,
  children,
}: {
  label: string
  prefix?: string
  onRemove?: () => void
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-[88px] flex-shrink-0 pt-1.5 flex items-baseline gap-1.5">
        <span className="text-xs font-medium">{label}</span>
        {prefix && <span className="text-[10px] text-muted-foreground font-mono">{prefix}</span>}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="flex-shrink-0 mt-1.5 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
