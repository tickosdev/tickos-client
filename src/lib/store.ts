// =====================================================
// TickOS Client Store
// =====================================================
// Estado global con Jotai
// =====================================================

import { atom } from 'jotai'
import { Account, Inbox, Ticket } from './api-client'

// Workspace activo
export const selectedAccountAtom = atom<Account | null>(null)

// Inbox seleccionado
export const selectedInboxAtom = atom<Inbox | null>(null)

// Ticket seleccionado
export const selectedTicketIdAtom = atom<string | null>(null)

// Lista de tickets
export const ticketsAtom = atom<Ticket[]>([])

// Lista de inboxes
export const inboxesAtom = atom<Inbox[]>([])

// Lista de accounts
export const accountsAtom = atom<Account[]>([])

// Estado de carga
export const isLoadingAtom = atom<boolean>(false)

// Seleccion multiple (bulk actions)
export const selectedTicketIdsAtom = atom<Set<string>>(new Set<string>())
