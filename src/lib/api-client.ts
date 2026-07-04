// =====================================================
// TickOS API Client
// =====================================================
// Consume la API de TickOS via proxy local (/api/*)
// El proxy agrega la API Key del servidor
// =====================================================

const API_BASE = '/api'

// ---------------------------------------------------
// Tipos base
// ---------------------------------------------------

export interface ApiResponse<T> {
  data: T
  meta?: Record<string, unknown>
  pagination?: {
    total: number
    limit: number
    offset: number
    has_more: boolean
  }
}

export interface ApiError {
  error: string
  details?: string
}

// ---------------------------------------------------
// Tipos de entidades
// ---------------------------------------------------

export interface Account {
  id: string
  name: string
  slug: string
  logo_url: string | null
  timezone: string
  status: string
  created_at: string
  role: 'admin' | 'member' | 'viewer'
  joined_at: string
  is_current: boolean
}

export interface Inbox {
  id: string
  account_id: string
  name: string
  channel_type: string
  description: string | null
  email_address: string | null
  phone_number: string | null
  auto_assign: boolean
  greeting_message: string | null
  language: string
  created_at: string
  updated_at: string
  connection_id: string | null
  prefix: string
  number_length: number
  current_number: number
  status: string
  is_active: boolean
}

export interface Customer {
  id: string
  account_id: string
  name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface CustomerDetail extends Customer {
  source?: string
  is_blocked?: boolean
  tickets: Array<{
    id: string
    client_id: string
    subject: string
    status: string
    priority: string
    created_at: string
  }>
}

export interface Ticket {
  id: string
  account_id: string
  inbox_id: string
  customer_id: string
  assigned_to: string | null
  subject: string
  status: 'open' | 'pending' | 'review' | 'resolved' | 'closed'
  priority: 'low' | 'normal' | 'medium' | 'high' | 'urgent'
  shared_uuid: string
  shared_expires_at: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  closed_at: string | null
  archived: boolean
  snoozed_until: string | null
  is_read: boolean
  archived_at: string | null
  read_at: string | null
  channel: string
  client_id: string
  message_count?: number
  attachment_count?: number
  customer?: {
    id: string
    name: string | null
    email: string | null
  }
  assigned_to_user?: {
    id: string
    email: string
    full_name: string | null
  }
  inbox?: {
    id: string
    name: string
    prefix: string
  }
  tags?: Tag[]
}

export interface Message {
  id: string
  ticket_id: string
  from_email: string | null
  from_name: string | null
  from_phone: string | null
  body_text: string | null
  body_html: string | null
  direction: 'inbound' | 'outbound' | 'internal'
  is_customer: boolean
  email_subject: string | null
  email_message_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  status: string
  is_read: boolean
  message_files?: MessageFile[]
}

export interface MessageFile {
  id: string
  file_name: string
  file_size: number
  file_type: string
  file_url: string
  is_inline?: boolean
  content_id?: string
}

export interface Tag {
  id: string
  name: string
  color: string
  account_id: string
}

export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: string
}

export interface TicketStats {
  total: number
  open: number
  pending: number
  review: number
  resolved: number
  closed: number
  unread: number
  archived: number
}

export interface SplitInboxView {
  id: string
  name: string
  filters: TicketFilters
  position: number
  account_id: string
}

// ---------------------------------------------------
// Parametros de consulta
// ---------------------------------------------------

export interface TicketFilters {
  status?: string
  priority?: string
  inbox_id?: string
  assigned_to?: string
  tag_id?: string
  archived?: boolean
  is_read?: boolean
  snoozed?: 'only_snoozed' | 'exclude_snoozed' | 'all'
  search?: string
  sort_by?: 'created_at' | 'updated_at' | 'priority'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface MessageFilters {
  limit?: number
  offset?: number
}

// ---------------------------------------------------
// Request helpers
// ---------------------------------------------------

function buildQuery(params?: Record<string, unknown> | object): string {
  if (!params) return ''
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      query.set(key, String(value))
    }
  }
  const str = query.toString()
  return str ? `?${str}` : ''
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
    throw new Error(error.error || error.message || `API Error: ${response.status}`)
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

// ---------------------------------------------------
// API: Accounts
// ---------------------------------------------------

export async function getAccounts(): Promise<ApiResponse<Account[]>> {
  return request('/accounts')
}

// ---------------------------------------------------
// API: Inboxes
// ---------------------------------------------------

export async function getInboxes(params?: { page?: number; limit?: number }): Promise<ApiResponse<Inbox[]>> {
  return request(`/inboxes${buildQuery(params)}`)
}

// ---------------------------------------------------
// API: Customers
// ---------------------------------------------------

export async function getCustomer(customerId: string): Promise<{ data: CustomerDetail }> {
  // La API v1 devuelve el customer directamente (sin envolver en { data })
  const response = await request<CustomerDetail & { data?: CustomerDetail }>(
    `/customers/${customerId}`
  )
  return { data: response.data ?? response }
}

// ---------------------------------------------------
// API: Tickets
// ---------------------------------------------------

export async function getTickets(params?: TicketFilters): Promise<ApiResponse<Ticket[]>> {
  return request(`/tickets${buildQuery(params)}`)
}

export async function getTicket(id: string): Promise<{ data: Ticket }> {
  // La API v1 devuelve el ticket directamente (sin envolver en { data })
  const response = await request<Ticket & { data?: Ticket }>(`/tickets/${id}`)
  return { data: response.data ?? response }
}

// PATCH /tickets/[id] — actualizar campos directos (subject, description)
export async function patchTicket(id: string, data: Partial<Pick<Ticket, 'subject'>>): Promise<{ data: Ticket }> {
  return request(`/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

// PATCH /tickets/[id]/manage — operaciones de gestion con { action, data }
export async function manageTicket(id: string, action: string, data?: Record<string, unknown>): Promise<{ data: Ticket }> {
  return request(`/tickets/${id}/manage`, {
    method: 'PATCH',
    body: JSON.stringify({ action, data }),
  })
}

// Helpers sobre manageTicket
export async function updateTicketStatus(id: string, status: Ticket['status']): Promise<{ data: Ticket }> {
  return manageTicket(id, 'update_status', { status })
}

export async function updateTicketPriority(id: string, priority: Ticket['priority']): Promise<{ data: Ticket }> {
  return manageTicket(id, 'update_priority', { priority })
}

export async function assignTicket(id: string, userId: string): Promise<{ data: Ticket }> {
  return manageTicket(id, 'assign', { user_id: userId })
}

export async function unassignTicket(id: string): Promise<{ data: Ticket }> {
  return manageTicket(id, 'unassign')
}

export async function markTicketRead(id: string): Promise<{ data: Ticket }> {
  return manageTicket(id, 'mark_read')
}

export async function markTicketUnread(id: string): Promise<{ data: Ticket }> {
  return manageTicket(id, 'mark_unread')
}

export async function archiveTicket(id: string): Promise<{ data: Ticket }> {
  return manageTicket(id, 'archive')
}

export async function unarchiveTicket(id: string): Promise<{ data: Ticket }> {
  return manageTicket(id, 'unarchive')
}

export async function deleteTicket(id: string): Promise<void> {
  return request(`/tickets/${id}`, { method: 'DELETE' })
}

// ---------------------------------------------------
// API: Ticket Messages
// ---------------------------------------------------

export async function getTicketMessages(ticketId: string, params?: MessageFilters): Promise<ApiResponse<Message[]>> {
  return request(`/tickets/${ticketId}/messages${buildQuery(params)}`)
}

export interface ReplyAttachment {
  fileName: string
  fileData: string // base64 sin prefijo data:
  contentType: string
}

export async function createReply(ticketId: string, data: {
  body_html?: string
  body_text?: string
  direction?: 'outbound' | 'internal'
  attachments?: ReplyAttachment[]
}): Promise<{ data: Message }> {
  return request(`/tickets/${ticketId}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ---------------------------------------------------
// API: Tags
// ---------------------------------------------------

export async function getTags(): Promise<ApiResponse<Tag[]>> {
  return request('/tags')
}

export async function addTagToTicket(ticketId: string, tagId: string): Promise<void> {
  return request(`/tickets/${ticketId}/tags`, {
    method: 'POST',
    body: JSON.stringify({ tag_id: tagId }),
  })
}

export async function removeTagFromTicket(ticketId: string, tagId: string): Promise<void> {
  return request(`/tickets/${ticketId}/tags/${tagId}`, {
    method: 'DELETE',
  })
}

// ---------------------------------------------------
// API: Bulk Actions
// ---------------------------------------------------

export async function bulkMarkRead(ticketIds: string[]): Promise<void> {
  return request('/tickets/bulk/mark-read', {
    method: 'POST',
    body: JSON.stringify({ ticket_ids: ticketIds }),
  })
}

export async function bulkMarkUnread(ticketIds: string[]): Promise<void> {
  return request('/tickets/bulk/mark-unread', {
    method: 'POST',
    body: JSON.stringify({ ticket_ids: ticketIds }),
  })
}

export async function bulkArchive(ticketIds: string[]): Promise<void> {
  return request('/tickets/bulk/archive', {
    method: 'POST',
    body: JSON.stringify({ ticket_ids: ticketIds }),
  })
}

export async function bulkUnarchive(ticketIds: string[]): Promise<void> {
  return request('/tickets/bulk/unarchive', {
    method: 'POST',
    body: JSON.stringify({ ticket_ids: ticketIds }),
  })
}

export async function bulkSnooze(ticketIds: string[], until: string): Promise<void> {
  return request('/tickets/bulk/snooze', {
    method: 'POST',
    body: JSON.stringify({ ticket_ids: ticketIds, snoozed_until: until }),
  })
}

export async function bulkDelete(ticketIds: string[]): Promise<void> {
  return request('/tickets/bulk/delete', {
    method: 'POST',
    body: JSON.stringify({ ticket_ids: ticketIds }),
  })
}

// ---------------------------------------------------
// API: Snooze
// ---------------------------------------------------

export async function snoozeTicket(ticketId: string, until: string): Promise<{ data: Ticket }> {
  return manageTicket(ticketId, 'snooze', { until })
}

export async function unsnoozeTicket(ticketId: string): Promise<{ data: Ticket }> {
  return manageTicket(ticketId, 'unsnooze')
}

// ---------------------------------------------------
// API: Stats
// ---------------------------------------------------

export async function getTicketStats(): Promise<{ data: TicketStats }> {
  return request('/tickets/stats')
}

// ---------------------------------------------------
// API: Users (agentes)
// ---------------------------------------------------

export async function getUsers(): Promise<ApiResponse<User[]>> {
  return request('/users')
}

// ---------------------------------------------------
// API: Compose (crear ticket nuevo)
// ---------------------------------------------------

export async function composeEmail(data: {
  inbox_id: string
  to_email: string
  cc?: string
  bcc?: string
  subject: string
  body_text: string
  body_html?: string
  from_name?: string
}): Promise<{ data: Ticket }> {
  return request('/tickets/compose', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ---------------------------------------------------
// API: Ticket Tags
// ---------------------------------------------------

export async function getTicketTags(ticketId: string): Promise<ApiResponse<Tag[]>> {
  return request(`/tickets/${ticketId}/tags`)
}
