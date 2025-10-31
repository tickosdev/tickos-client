import { Account, Inbox, Ticket } from '@/types/tickos'

// TickOS API Client Configuration
// Using the actual tickos-core API endpoint
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export interface TickOSConfig {
  apiKey: string
  baseUrl?: string
}

interface TicketsResponse {
  tickets: Ticket[]
  pagination: {
    total: number
    page: number
    limit: number
  }
}

interface InboxesResponse {
  inboxes: Inbox[]
}

interface TicketDetailResponse {
  ticket: Ticket
}

export class TickOSClient {
  private apiKey: string
  private baseUrl: string

  constructor(config: TickOSConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || API_BASE_URL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // Log the curl command for debugging
    const method = options.method || 'GET'
    const curlCommand = `curl -X ${method} '${url}' \\
  -H 'Authorization: Bearer ${this.apiKey}' \\
  -H 'Content-Type: application/json'${options.body ? ` \\
  -d '${options.body}'` : ''}`
    
    console.log('\n🔵 API Request:')
    console.log(curlCommand)
    console.log('\n')

    const response = await fetch(url, {
      ...options,
      headers,
      cache: 'no-store',
    })

    console.log(`📡 Response Status: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      const responseText = await response.text()
      console.error('❌ Response Body:', responseText)
      
      let error
      try {
        error = JSON.parse(responseText)
      } catch {
        error = { error: responseText || 'Unknown error' }
      }
      
      throw new Error(error.error || `API request failed: ${response.status} ${response.statusText}`)
    }

    const responseData = await response.json()
    console.log('✅ Response Data:', JSON.stringify(responseData, null, 2))
    
    return responseData
  }

  // Accounts API
  async getAccounts(): Promise<Account[]> {
    const response = await this.request<{ accounts: Account[] }>('/accounts')
    return response.accounts
  }

  // Inboxes API
  async getInboxes(): Promise<Inbox[]> {
    const response = await this.request<{ data: Inbox[] }>('/v1/inboxes')
    return response.data
  }

  // Tickets API
  async getTickets(params?: { 
    status?: string
    inbox_id?: string
    limit?: number
    offset?: number 
  }): Promise<Ticket[]> {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.inbox_id) searchParams.set('inbox_id', params.inbox_id)
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())
    
    const query = searchParams.toString()
    const response = await this.request<{ data: Ticket[] }>(`/v1/tickets${query ? `?${query}` : ''}`)
    return response.data
  }

  async getTicket(id: string): Promise<Ticket> {
    const response = await this.request<{ data: Ticket }>(`/v1/tickets/${id}`)
    return response.data
  }

  async createTicket(data: {
    subject: string
    customer_email: string
    message: string
    inbox_id: string
  }): Promise<Ticket> {
    const response = await this.request<{ ticket: Ticket }>('/v1/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.ticket
  }

  // Emails API
  async sendEmail(data: {
    to: string
    from: string
    subject: string
    html?: string
    text?: string
  }) {
    return this.request('/v1/emails', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Stats API
  async getStats() {
    return this.request('/v1/tickets/stats')
  }
}

// Export a factory function
export function createTickOSClient(apiKey: string, baseUrl?: string) {
  return new TickOSClient({ apiKey, baseUrl })
}
