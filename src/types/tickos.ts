// =====================================================
// TICKET TYPES - Matching tickos-core API
// =====================================================

export type TicketStatus = 'open' | 'pending' | 'review' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'normal' | 'medium' | 'high' | 'urgent'
export type TicketChannel = 'email' | 'direct'

// =====================================================
// ACCOUNT TYPES
// =====================================================

export interface Account {
  id: string
  name: string
  slug: string
  logo_url?: string
  timezone?: string
  status?: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  account_id: string
  email: string
  phone?: string
  name?: string
  avatar_url?: string
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Inbox {
  id: string
  account_id: string
  name: string
  email_address: string | null
  channel_type?: 'email' | 'whatsapp' | 'voice'
  status?: string
  created_at: string
  description?: string
  auto_assign?: boolean
  greeting_message?: string
  language?: string
  connection_id?: string
  prefix?: string
  number_length?: number
  current_number?: number
  signature_html?: string
  auto_response_text?: string
  reply_delimiter?: string
  email_from_response?: string
  webhooks?: any[]
  deleted_at?: string | null
  is_active?: boolean
  auto_responder_enabled?: boolean
  auto_response_subject?: string
  metadata_fields?: any[]
  slack_config?: any
}

export interface Ticket {
  id: string
  client_id: string
  account_id: string
  inbox_id: string
  customer_id: string
  assigned_to?: string
  subject: string
  status: TicketStatus
  priority: TicketPriority
  shared_uuid?: string
  shared_expires_at?: string
  email_subject?: string
  email_message_id?: string
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
  closed_at?: string
  is_read?: boolean
  archived?: boolean
  // Relations from API
  customer?: Customer
  inbox?: {
    id: string
    name: string
    email_address?: string
  }
  assigned_to_user?: {
    id: string
    full_name: string | null
    email: string
  }
  messages_count?: number
  has_unread_messages?: boolean
  has_attachments?: boolean
  messages?: Message[]
}

export interface Message {
  id: string
  ticket_id: string
  from_email?: string
  from_name?: string
  from_phone?: string
  body_text?: string
  body_html?: string
  direction: 'inbound' | 'outbound'
  is_customer: boolean
  is_read?: boolean
  email_subject?: string
  email_message_id?: string
  email_in_reply_to?: string
  email_references?: string[]
  metadata?: Record<string, unknown>
  created_at: string
  message_files?: Array<{
    id: string
    file_name: string
    file_size: number
    file_type: string
    file_url: string
    is_inline?: boolean
    content_id?: string
  }>
}

export interface Account {
  id: string
  name: string
  email: string
}
