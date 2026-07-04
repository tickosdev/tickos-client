'use client'

import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { TicketFilters } from '@/lib/api-client'

// ---------------------------------------------------
// Types
// ---------------------------------------------------

export interface SplitInboxFilters {
  status?: string[]
  priority?: string[]
  assignee?: string | null
  inbox_id?: string | null
  read_status?: 'all' | 'read' | 'unread'
  show_archived?: boolean | 'exclude' | 'include' | 'only'
}

export interface SplitInboxView {
  id: string
  name: string
  filters: SplitInboxFilters
  sort_order: 'desc' | 'asc'
  is_default: boolean
  is_visible: boolean
  order: number
}

// ---------------------------------------------------
// Default views
// ---------------------------------------------------

const DEFAULT_VIEWS: SplitInboxView[] = [
  {
    id: 'view_all',
    name: 'All',
    filters: {},
    sort_order: 'desc',
    is_default: true,
    is_visible: true,
    order: 0,
  },
  {
    id: 'view_inbox',
    name: 'Inbox',
    filters: { status: ['open', 'review'], show_archived: 'exclude' },
    sort_order: 'desc',
    is_default: true,
    is_visible: true,
    order: 1,
  },
  {
    id: 'view_waiting',
    name: 'Waiting',
    filters: { status: ['pending'], show_archived: 'exclude' },
    sort_order: 'desc',
    is_default: true,
    is_visible: true,
    order: 2,
  },
]

// ---------------------------------------------------
// Atoms (persisted in localStorage)
// ---------------------------------------------------

const splitViewsAtom = atomWithStorage<SplitInboxView[]>('tickos_split_views', DEFAULT_VIEWS)
const activeViewIdAtom = atomWithStorage<string>('tickos_active_view', 'view_all')

// ---------------------------------------------------
// Hook
// ---------------------------------------------------

export function useSplitInbox() {
  const [views, setViews] = useAtom(splitViewsAtom)
  const [activeViewId, setActiveViewId] = useAtom(activeViewIdAtom)

  const visibleViews = views
    .filter(v => v.is_visible)
    .sort((a, b) => a.order - b.order)

  const activeView = views.find(v => v.id === activeViewId) || views[0]

  const createView = (name: string, filters: SplitInboxFilters = {}) => {
    const id = `view_${Date.now()}`
    const maxOrder = Math.max(...views.map(v => v.order), -1)
    const newView: SplitInboxView = {
      id,
      name,
      filters,
      sort_order: 'desc',
      is_default: false,
      is_visible: true,
      order: maxOrder + 1,
    }
    setViews([...views, newView])
    return newView
  }

  const updateView = (id: string, updates: Partial<Omit<SplitInboxView, 'id' | 'is_default'>>) => {
    setViews(views.map(v => {
      if (v.id !== id) return v
      // "All" default view can only toggle visibility
      if (v.id === 'view_all' && v.is_default) {
        return { ...v, is_visible: updates.is_visible ?? v.is_visible }
      }
      return { ...v, ...updates }
    }))
  }

  const deleteView = (id: string) => {
    // Cannot delete "All" default view
    if (id === 'view_all') return
    setViews(views.filter(v => v.id !== id))
    if (activeViewId === id) {
      setActiveViewId('view_all')
    }
  }

  const reorderViews = (viewIds: string[]) => {
    setViews(views.map(v => {
      const idx = viewIds.indexOf(v.id)
      if (idx === -1) return v
      return { ...v, order: idx }
    }))
  }

  const resetToDefaults = () => {
    setViews(DEFAULT_VIEWS)
    setActiveViewId('view_all')
  }

  // Convert SplitInboxFilters to TicketFilters for API calls
  const getTicketFilters = (inboxId?: string): TicketFilters => {
    const f = activeView?.filters || {}
    const result: TicketFilters = {}

    if (inboxId) result.inbox_id = inboxId
    if (f.status && f.status.length > 0) result.status = f.status[0]
    if (f.priority && f.priority.length > 0) result.priority = f.priority[0]
    if (f.assignee) result.assigned_to = f.assignee
    if (f.read_status === 'read') result.is_read = true
    if (f.read_status === 'unread') result.is_read = false
    if (f.show_archived === 'only') result.archived = true
    else if (f.show_archived === 'exclude' || f.show_archived === false) result.archived = false

    result.sort_order = activeView?.sort_order || 'desc'

    return result
  }

  return {
    views,
    visibleViews,
    activeView,
    activeViewId,
    setActiveViewId,
    createView,
    updateView,
    deleteView,
    reorderViews,
    resetToDefaults,
    getTicketFilters,
  }
}
