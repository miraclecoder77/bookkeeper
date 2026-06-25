export interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string // ISO date
  receiptUrl?: string
}

export interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

export interface Invoice {
  id: string
  clientId: string
  invoiceNumber: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  issueDate: string // ISO date
  dueDate: string // ISO date
  lineItems: LineItem[]
  total: number
  notes?: string
}

export interface Client {
  id: string
  name: string
  email: string
  address: string
  phone?: string
  taxId?: string
}

export interface BusinessSettings {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  taxId?: string
  logo?: string // base64 or data URL
  currency: string // e.g., 'USD', 'EUR'
  taxRate?: number // percentage
}

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'error' | 'offline' | 'local'
  lastSync?: Date
  error?: string
}

export interface User {
  id: string
  email: string
  name: string
  picture?: string
  accessToken: string
  refreshToken?: string
  tokenExpiry?: number
}
