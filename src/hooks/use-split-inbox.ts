'use client'

import * as React from 'react'
import { useAtom, useSetAtom } from 'jotai'
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
  tag_id?: string | null
  read_status?: 'all' | 'read' | 'unread'
  show_archived?: boolean | 'exclude' | 'include' | 'only'
  show_snoozed?: 'exclude' | 'include' | 'only'
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
    filters: { status: ['open', 'pending', 'review'], show_archived: 'exclude' },
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
  {
    id: 'view_unread',
    name: 'Unread',
    filters: { read_status: 'unread', show_archived: 'exclude' },
    sort_order: 'desc',
    is_default: true,
    is_visible: true,
    order: 3,
  },
  {
    id: 'view_archived',
    name: 'Archived',
    filters: { show_archived: 'only' },
    sort_order: 'desc',
    is_default: true,
    is_visible: true,
    order: 4,
  },
]

// ---------------------------------------------------
// Helpers
// ---------------------------------------------------

// Convierte los filtros de una vista a TicketFilters para el API.
// Los valores multiples (status, priority) se envian separados por coma.
export function buildTicketFilters(view: SplitInboxView | undefined, inboxId?: string): TicketFilters {
  const f = view?.filters || {}
  const result: TicketFilters = {}

  // El inbox del filtro de la vista tiene precedencia sobre el seleccionado
  if (f.inbox_id) result.inbox_id = f.inbox_id
  else if (inboxId) result.inbox_id = inboxId

  if (f.status && f.status.length > 0) result.status = f.status.join(',')
  if (f.priority && f.priority.length > 0) result.priority = f.priority.join(',')
  if (f.assignee) result.assigned_to = f.assignee
  if (f.tag_id) result.tag_id = f.tag_id
  if (f.read_status === 'read') result.is_read = true
  if (f.read_status === 'unread') result.is_read = false
  if (f.show_archived === 'only') result.archived = true
  else if (f.show_archived === 'exclude' || f.show_archived === false) result.archived = false
  if (f.show_snoozed === 'only') result.snoozed = 'only_snoozed'
  else if (f.show_snoozed === 'exclude') result.snoozed = 'exclude_snoozed'

  result.sort_order = view?.sort_order || 'desc'

  return result
}

// ---------------------------------------------------
// Atoms (persisted in localStorage)
// ---------------------------------------------------

const splitViewsAtom = atomWithStorage<SplitInboxView[]>('tickos_split_views', DEFAULT_VIEWS)
const activeViewIdAtom = atomWithStorage<string>('tickos_active_view', 'view_all')
// Version del esquema de vistas: permite migrar localStorage de usuarios previos
const splitViewsVersionAtom = atomWithStorage<number>('tickos_split_views_version', 0)
const CURRENT_VIEWS_VERSION = 2

// ---------------------------------------------------
// Hook
// ---------------------------------------------------

export function useSplitInbox() {
  const [views, setViews] = useAtom(splitViewsAtom)
  const [activeViewId, setActiveViewId] = useAtom(activeViewIdAtom)

  const setViewsVersion = useSetAtom(splitViewsVersionAtom)

  // Migracion: agregar vistas por defecto nuevas y actualizar filtros de
  // vistas default (una sola vez por version).
  // IMPORTANTE: se lee localStorage directo porque atomWithStorage hidrata
  // DESPUES del primer render; usar el valor del atom aqui veria siempre los
  // defaults y sobreescribiria las vistas custom del usuario en cada carga.
  React.useEffect(() => {
    try {
      const rawVersion = window.localStorage.getItem('tickos_split_views_version')
      const version = rawVersion ? Number(JSON.parse(rawVersion)) : 0
      if (version >= CURRENT_VIEWS_VERSION) return

      const rawViews = window.localStorage.getItem('tickos_split_views')
      const stored: SplitInboxView[] = rawViews ? JSON.parse(rawViews) : [...DEFAULT_VIEWS]

      let next = [...stored]
      const missing = DEFAULT_VIEWS.filter(d => !next.some(v => v.id === d.id))
      if (missing.length > 0) next = [...next, ...missing]

      // v2: Inbox ahora incluye pending (open, pending, review)
      next = next.map(v =>
        v.id === 'view_inbox'
          ? { ...v, filters: { status: ['open', 'pending', 'review'], show_archived: 'exclude' as const } }
          : v
      )

      setViews(next)
      setViewsVersion(CURRENT_VIEWS_VERSION)
    } catch (err) {
      console.error('Error migrating split views:', err)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const visibleViews = views
    .filter(v => v.is_visible)
    .sort((a, b) => a.order - b.order)

  const activeView = views.find(v => v.id === activeViewId) || views[0]

  const createView = (name: string, filters: SplitInboxFilters = {}, sort_order: 'desc' | 'asc' = 'desc') => {
    const id = `view_${Date.now()}`
    const maxOrder = Math.max(...views.map(v => v.order), -1)
    const newView: SplitInboxView = {
      id,
      name,
      filters,
      sort_order,
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
    return buildTicketFilters(activeView, inboxId)
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
