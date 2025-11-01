// =====================================================
// TickOS API Client
// =====================================================
// Client for consuming TickOS API endpoints via proxy
// =====================================================

// Use local proxy to avoid CORS issues
const API_BASE_URL = '/api'

interface ApiResponse<T> {
  data: T
  meta?: any
  pagination?: any
}

class TickOSClient {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string, baseUrl: string = API_BASE_URL) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // Remove /api/v1 prefix since proxy adds it
    const cleanEndpoint = endpoint.replace('/api/v1', '')
    const url = `${this.baseUrl}${cleanEndpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `API Error: ${response.status}`)
    }

    return response.json()
  }

  // Accounts (Workspaces)
  async getAccounts(): Promise<ApiResponse<Account[]>> {
    return this.request('/accounts')
  }

  // Inboxes
  async getInboxes(params?: { page?: number; limit?: number }): Promise<ApiResponse<Inbox[]>> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', params.page.toString())
    if (params?.limit) query.set('limit', params.limit.toString())
    
    return this.request(`/inboxes${query.toString() ? `?${query}` : ''}`)
  }

  // Tickets
  async getTickets(params?: TicketFilters): Promise<ApiResponse<Ticket[]>> {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.priority) query.set('priority', params.priority)
    if (params?.inbox_id) query.set('inbox_id', params.inbox_id)
    if (params?.archived !== undefined) query.set('archived', params.archived.toString())
    if (params?.is_read !== undefined) query.set('is_read', params.is_read.toString())
    if (params?.limit) query.set('limit', params.limit.toString())
    if (params?.offset) query.set('offset', params.offset.toString())
    
    return this.request(`/tickets${query.toString() ? `?${query}` : ''}`)
  }

  async getTicket(id: string): Promise<{ data: Ticket }> {
    return this.request(`/tickets/${id}`)
  }

  async getTicketMessages(ticketId: string): Promise<ApiResponse<Message[]>> {
    return this.request(`/tickets/${ticketId}/messages`)
  }

  // Ticket Management
  async updateTicket(id: string, data: Partial<Ticket>): Promise<{ data: Ticket }> {
    return this.request(`/tickets/${id}/manage`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }
}

// Types
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

export interface Ticket {
  id: string
  account_id: string
  inbox_id: string
  customer_id: string
  assigned_to: string | null
  subject: string
  status: 'open' | 'pending' | 'resolved' | 'closed'
  priority: 'low' | 'normal' | 'medium' | 'high' | 'urgent'
  shared_uuid: string
  shared_expires_at: string | null
  metadata: any
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
}

export interface Message {
  id: string
  ticket_id: string
  from_email: string | null
  from_name: string | null
  from_phone: string | null
  body_text: string | null
  body_html: string | null
  direction: 'inbound' | 'outbound'
  is_customer: boolean
  email_subject: string | null
  email_message_id: string | null
  metadata: any
  created_at: string
  status: string
  is_read: boolean
}

export interface TicketFilters {
  status?: string
  priority?: string
  inbox_id?: string
  archived?: boolean
  is_read?: boolean
  limit?: number
  offset?: number
}

// Export singleton instance (no API key needed since proxy handles it)
export const apiClient = new TickOSClient('', API_BASE_URL)
