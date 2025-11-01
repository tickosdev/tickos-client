// =====================================================
// TickOS Client Store
// =====================================================
// Global state management using Jotai
// =====================================================

import { atom } from 'jotai'
import { Account, Inbox, Ticket } from './api-client'

// Selected workspace (account)
export const selectedAccountAtom = atom<Account | null>(null)

// Selected inbox
export const selectedInboxAtom = atom<Inbox | null>(null)

// Selected ticket
export const selectedTicketIdAtom = atom<string | null>(null)

// Tickets list
export const ticketsAtom = atom<Ticket[]>([])

// Inboxes list
export const inboxesAtom = atom<Inbox[]>([])

// Accounts list
export const accountsAtom = atom<Account[]>([])

// Loading states
export const isLoadingAtom = atom<boolean>(false)
