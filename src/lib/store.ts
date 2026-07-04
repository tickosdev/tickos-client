// =====================================================
// TickOS Client Store
// =====================================================
// Estado global con Jotai
// =====================================================

import { atom } from 'jotai'
import { Inbox, Ticket } from './api-client'

// Inbox seleccionado
export const selectedInboxAtom = atom<Inbox | null>(null)

// Ticket seleccionado
export const selectedTicketIdAtom = atom<string | null>(null)

// Lista de tickets
export const ticketsAtom = atom<Ticket[]>([])

// Lista de inboxes
export const inboxesAtom = atom<Inbox[]>([])
