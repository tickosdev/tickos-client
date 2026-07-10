'use client'

import * as React from 'react'
import { atom, useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import {
  TicketFilters,
  SplitViewRow,
  getSplitViews,
  createSplitView,
  updateSplitView,
  deleteSplitView,
} from '@/lib/api-client'

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
// Helpers
// ---------------------------------------------------

// Convierte la fila del API (tabla split_inbox_views) a la vista local
function rowToView(row: SplitViewRow): SplitInboxView {
  return {
    id: row.id,
    name: row.name,
    filters: (row.filters || {}) as SplitInboxFilters,
    sort_order: row.sort_order || 'desc',
    is_default: row.is_default,
    is_visible: row.is_visible,
    order: row.display_order,
  }
}

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
// Atoms
// Las vistas viven en el API de tickos (tabla split_inbox_views);
// solo la vista activa (preferencia de UI) se guarda en localStorage.
// ---------------------------------------------------

const splitViewsAtom = atom<SplitInboxView[]>([])
const activeViewIdAtom = atomWithStorage<string>('tickos_active_view', '')

// Migracion one-time: sube al API las vistas custom que el usuario
// tenia en localStorage (version anterior del hook) y limpia las keys.
async function migrateLocalViews(loaded: SplitInboxView[]): Promise<SplitInboxView[]> {
  try {
    const raw = window.localStorage.getItem('tickos_split_views')
    if (!raw) return loaded
    const stored: SplitInboxView[] = JSON.parse(raw)
    const customs = (Array.isArray(stored) ? stored : []).filter(v => v && v.is_default === false)
    const result = [...loaded]
    for (const v of customs) {
      // Evitar duplicados si la migracion corre mas de una vez
      if (result.some(x => x.name === v.name)) continue
      const res = await createSplitView({
        name: v.name,
        filters: (v.filters || {}) as Record<string, unknown>,
        sort_order: v.sort_order || 'desc',
      })
      result.push(rowToView(res.data))
    }
    window.localStorage.removeItem('tickos_split_views')
    window.localStorage.removeItem('tickos_split_views_version')
    return result
  } catch (err) {
    console.error('Error migrating local split views:', err)
    return loaded
  }
}

// Evita cargas duplicadas cuando varios componentes montan el hook
let loadPromise: Promise<SplitInboxView[]> | null = null

function loadViewsOnce(): Promise<SplitInboxView[]> {
  if (!loadPromise) {
    loadPromise = getSplitViews()
      .then(res => (res.data || []).map(rowToView))
      .then(migrateLocalViews)
      .catch(err => {
        console.error('Error loading split views:', err)
        loadPromise = null // permitir reintento en el proximo mount
        return []
      })
  }
  return loadPromise
}

// ---------------------------------------------------
// Hook
// ---------------------------------------------------

export function useSplitInbox() {
  const [views, setViews] = useAtom(splitViewsAtom)
  const [activeViewId, setActiveViewId] = useAtom(activeViewIdAtom)

  // Carga inicial desde el API (el servidor seedea las vistas por defecto)
  React.useEffect(() => {
    let cancelled = false
    loadViewsOnce().then(loaded => {
      if (!cancelled && loaded.length > 0) setViews(loaded)
    })
    return () => { cancelled = true }
  }, [setViews])

  const visibleViews = views
    .filter(v => v.is_visible)
    .sort((a, b) => a.order - b.order)

  // Si la vista activa guardada ya no existe (o aun no carga), usar la primera
  const activeView = views.find(v => v.id === activeViewId) || visibleViews[0] || views[0]

  const createView = async (name: string, filters: SplitInboxFilters = {}, sort_order: 'desc' | 'asc' = 'desc') => {
    try {
      const res = await createSplitView({
        name,
        filters: filters as Record<string, unknown>,
        sort_order,
      })
      const view = rowToView(res.data)
      setViews(prev => [...prev, view])
      return view
    } catch (err) {
      console.error('Error creating split view:', err)
      return null
    }
  }

  const updateView = async (id: string, updates: Partial<Omit<SplitInboxView, 'id' | 'is_default'>>) => {
    const current = views.find(v => v.id === id)
    if (!current) return
    // La vista "All" por defecto solo permite cambiar visibilidad (regla del API)
    const isAllView = current.is_default && current.name === 'All'
    try {
      const res = await updateSplitView(id, isAllView
        ? { is_visible: updates.is_visible }
        : {
            ...(updates.name !== undefined ? { name: updates.name } : {}),
            ...(updates.filters !== undefined ? { filters: updates.filters as Record<string, unknown> } : {}),
            ...(updates.sort_order !== undefined ? { sort_order: updates.sort_order } : {}),
            ...(updates.is_visible !== undefined ? { is_visible: updates.is_visible } : {}),
            ...(updates.order !== undefined ? { display_order: updates.order } : {}),
          })
      const view = rowToView(res.data)
      setViews(prev => prev.map(v => (v.id === id ? view : v)))
    } catch (err) {
      console.error('Error updating split view:', err)
    }
  }

  const deleteView = async (id: string) => {
    const current = views.find(v => v.id === id)
    // La vista "All" por defecto no se puede eliminar
    if (current && current.is_default && current.name === 'All') return
    try {
      await deleteSplitView(id)
      setViews(prev => prev.filter(v => v.id !== id))
      if (activeViewId === id) {
        setActiveViewId('')
      }
    } catch (err) {
      console.error('Error deleting split view:', err)
    }
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
    getTicketFilters,
  }
}
