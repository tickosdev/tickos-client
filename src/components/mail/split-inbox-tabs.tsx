'use client'

import * as React from 'react'
import { Plus, X, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useSplitInbox, SplitInboxView, SplitInboxFilters } from '@/hooks/use-split-inbox'

interface SplitInboxTabsProps {
  onViewChange?: () => void
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'pending', label: 'Pending' },
  { value: 'review', label: 'Review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

const ARCHIVE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'exclude', label: 'Exclude archived' },
  { value: 'only', label: 'Only archived' },
]

export function SplitInboxTabs({ onViewChange }: SplitInboxTabsProps) {
  const {
    visibleViews,
    activeViewId,
    setActiveViewId,
    createView,
    updateView,
    deleteView,
  } = useSplitInbox()

  const [isCreating, setIsCreating] = React.useState(false)
  const [editingViewId, setEditingViewId] = React.useState<string | null>(null)
  const [deletingViewId, setDeletingViewId] = React.useState<string | null>(null)

  const handleSelect = (viewId: string) => {
    setActiveViewId(viewId)
    onViewChange?.()
  }

  const handleConfirmDelete = (viewId: string) => {
    deleteView(viewId)
    setDeletingViewId(null)
    onViewChange?.()
  }

  return (
    <div className="py-2 px-2">
      <div className="flex items-center justify-between px-2 mb-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Views
        </span>

        {/* Create view */}
        <Popover open={isCreating} onOpenChange={setIsCreating}>
          <PopoverTrigger asChild>
            <button className="h-4 w-4 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors">
              <Plus className="h-3 w-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-3" side="right" align="start">
            <ViewForm
              onSave={(name, filters) => {
                createView(name, filters)
                setIsCreating(false)
              }}
              onCancel={() => setIsCreating(false)}
            />
          </PopoverContent>
        </Popover>
      </div>

      <ul className="flex flex-col gap-0.5">
        {visibleViews.map((view) => (
          <li key={view.id} className="relative">
            {/* Delete confirmation popover */}
            {deletingViewId === view.id && (
              <Popover open onOpenChange={(open) => { if (!open) setDeletingViewId(null) }}>
                <PopoverTrigger asChild>
                  <span className="absolute inset-0" />
                </PopoverTrigger>
                <PopoverContent className="w-48 p-3" side="right" align="start">
                  <div className="space-y-2">
                    <p className="text-xs text-foreground">
                      Delete <span className="font-medium">{view.name}</span>?
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 flex-1 text-[10px]"
                        onClick={() => setDeletingViewId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-6 flex-1 text-[10px]"
                        onClick={() => handleConfirmDelete(view.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Edit popover */}
            <Popover
              open={editingViewId === view.id}
              onOpenChange={(open) => { if (!open) setEditingViewId(null) }}
            >
              <PopoverTrigger asChild>
                <button
                  onClick={() => handleSelect(view.id)}
                  className={cn(
                    'w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors group',
                    view.id === activeViewId
                      ? 'bg-accent text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  )}
                >
                  <span className={cn(
                    'h-1.5 w-1.5 rounded-full flex-shrink-0',
                    view.id === activeViewId ? 'bg-primary' : 'bg-muted-foreground/40'
                  )} />
                  <span className="truncate flex-1 text-left">{view.name}</span>

                  {/* Action icons (hover) */}
                  {!view.is_default && (
                    <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingViewId(view.id)
                        }}
                        className="rounded p-0.5 hover:bg-accent"
                      >
                        <Settings2 className="h-3 w-3" />
                      </span>
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingViewId(view.id)
                        }}
                        className="rounded p-0.5 hover:bg-destructive/20 text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </span>
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              {editingViewId === view.id && (
                <PopoverContent className="w-52 p-3" side="right" align="start">
                  <ViewForm
                    view={view}
                    onSave={(name, filters) => {
                      updateView(view.id, { name, filters })
                      setEditingViewId(null)
                      onViewChange?.()
                    }}
                    onCancel={() => setEditingViewId(null)}
                  />
                </PopoverContent>
              )}
            </Popover>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---------------------------------------------------
// Shared form for Create / Edit
// ---------------------------------------------------

function ViewForm({
  view,
  onSave,
  onCancel,
}: {
  view?: SplitInboxView
  onSave: (name: string, filters: SplitInboxFilters) => void
  onCancel: () => void
}) {
  const [name, setName] = React.useState(view?.name || '')
  const [statusFilter, setStatusFilter] = React.useState<string>(
    view?.filters.status?.[0] || 'any'
  )
  const [archiveFilter, setArchiveFilter] = React.useState<string>(
    (view?.filters.show_archived as string) || 'all'
  )

  const handleSave = () => {
    if (!name.trim()) return
    const filters: SplitInboxFilters = {}
    if (statusFilter && statusFilter !== 'any') filters.status = [statusFilter]
    if (archiveFilter && archiveFilter !== 'all') {
      filters.show_archived = archiveFilter as 'exclude' | 'include' | 'only'
    }
    onSave(name.trim(), filters)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSave() }
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div className="space-y-2.5">
      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
          Name
        </Label>
        <Input
          placeholder="View name"
          className="h-7 text-xs"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </div>

      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
          Status
        </Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any" className="text-xs">Any</SelectItem>
            {STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
          Archived
        </Label>
        <Select value={archiveFilter} onValueChange={setArchiveFilter}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ARCHIVE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-6 flex-1 text-[10px]" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" className="h-6 flex-1 text-[10px]" onClick={handleSave} disabled={!name.trim()}>
          {view ? 'Save' : 'Create'}
        </Button>
      </div>
    </div>
  )
}
