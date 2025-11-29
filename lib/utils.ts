import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type {
  BadgeVariant,
  ICSEventData,
  PaymentStatus,
  RegistrationStatus,
} from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) {
    return 'Consulte valores'
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount)
}

/**
 * Calculate the 10% service fee for a subtotal.
 * @param subtotal - Base amount for the calculation
 * @returns Service fee rounded to two decimal places
 */
export function calculateServiceFee(subtotal: number): number {
  if (!subtotal || isNaN(subtotal)) {
    return 0
  }

  return Math.round(subtotal * 0.1 * 100) / 100
}

/**
 * Calculate the final total including service fee.
 * @param subtotal - Base amount for the calculation
 * @param serviceFee - Service fee value
 * @returns Total rounded to two decimal places
 */
export function calculateTotal(subtotal: number, serviceFee: number): number {
  const total = (subtotal || 0) + (serviceFee || 0)
  return Math.round(total * 100) / 100
}

/**
 * Build a human-friendly ticket code based on the registration ID.
 */
export function generateTicketCode(registrationId: string): string {
  if (!registrationId) {
    return '#SP0000-0000'
  }

  const year = new Date().getFullYear()
  const sanitized = registrationId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  const suffix = sanitized.slice(-4).padStart(4, '0')
  return `#SP${year}-${suffix}`
}

export function formatPaymentStatus(status: PaymentStatus): string {
  switch (status) {
    case 'paid':
      return 'Pago'
    case 'pending':
      return 'Pendente'
    case 'failed':
      return 'Falhou'
    case 'refunded':
      return 'Reembolsado'
    default:
      return 'Desconhecido'
  }
}

export function formatRegistrationStatus(status: RegistrationStatus): string {
  switch (status) {
    case 'confirmed':
      return 'Confirmado'
    case 'pending':
      return 'Pendente'
    case 'cancelled':
      return 'Cancelado'
    default:
      return 'Desconhecido'
  }
}

export function getStatusBadgeVariant(status: string): BadgeVariant {
  const normalized = status.toLowerCase()

  if (['paid', 'confirmado', 'confirmed'].includes(normalized)) {
    return 'success'
  }

  if (['pending', 'pendente', 'em análise'].includes(normalized)) {
    return 'warning'
  }

  if (['failed', 'cancelled', 'cancelado', 'refunded'].includes(normalized)) {
    return 'error'
  }

  return 'neutral'
}

/**
 * Validate email string using a simple regex.
 * @param email - Email string to validate
 * @returns True when the email matches the pattern
 */
export function validateEmail(email: string): boolean {
  if (!email) {
    return false
  }

  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return pattern.test(email.trim())
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj)
}

/**
 * Format date in short format for event listings
 * @param date - Date to format (Date object or ISO string)
 * @returns Formatted date string (e.g., "Sáb, 12 Abr")
 */
export function formatDateShort(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return 'Data inválida'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(dateObj)
}

/**
 * Format date in long format for event details
 * @param date - Date to format (Date object or ISO string)
 * @returns Formatted date string (e.g., "12 de Abril de 2024")
 */
export function formatEventDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return 'Data inválida'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(dateObj)
}

/**
 * Formats date and time in a long Brazilian format (e.g., "15 de março de 2025 • 07:00").
 * Treats dates without timezone as São Paulo local time.
 */
export function formatDateTimeLong(date: Date | string): string {
  let dateObj: Date

  if (typeof date === 'string') {
    // If the string doesn't have timezone info, treat it as São Paulo local time
    // by parsing the components directly
    if (!date.includes('Z') && !date.includes('+') && !date.match(/[+-]\d{2}:\d{2}$/)) {
      // Parse as local time components to avoid UTC conversion
      const [datePart, timePart] = date.split('T')
      const [year, month, day] = datePart.split('-').map(Number)
      const [hours, minutes] = (timePart || '00:00').split(':').map(Number)

      // Create date with explicit components (treated as local time)
      dateObj = new Date(year, month - 1, day, hours, minutes)
    } else {
      dateObj = new Date(date)
    }
  } else {
    dateObj = date
  }

  if (isNaN(dateObj.getTime())) {
    return 'Data inválida'
  }

  const datePartFormatted = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(dateObj)

  const timePartFormatted = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj)

  return `${datePartFormatted} • ${timePartFormatted}`
}

/**
 * Calculate days remaining until a given date
 * @param date - Target date (Date object or ISO string)
 * @returns Number of days until the date (negative if past)
 */
export function calculateDaysUntil(date: Date | string): number {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return 0
  }

  const now = new Date()
  const diffTime = dateObj.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

/**
 * Get user initials from name
 * @param name - Full name of the user
 * @returns Initials (max 2 characters)
 */
export function getInitials(name: string): string {
  if (!name || name.trim().length === 0) return 'U'

  const words = name.trim().split(/\s+/)

  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase()
  }

  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return ''

  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) {
    return phone
  }

  const ddd = digits.slice(0, 2)
  const firstPart = digits.length === 11 ? digits.slice(2, 7) : digits.slice(2, 6)
  const secondPart = digits.length === 11 ? digits.slice(7, 11) : digits.slice(6, 10)

  return `(${ddd}) ${firstPart}-${secondPart}`
}

/**
 * Format CPF string to the pattern 000.000.000-00
 * @param value - CPF string (may contain non-numeric characters)
 * @returns Formatted CPF string
 */
export function formatCPF(value: string): string {
  if (!value) return ''

  const digits = value.replace(/\D/g, '')
  const limited = digits.slice(0, 11)

  if (limited.length <= 3) {
    return limited
  } else if (limited.length <= 6) {
    return `${limited.slice(0, 3)}.${limited.slice(3)}`
  } else if (limited.length <= 9) {
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`
  } else {
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`
  }
}

/**
 * Format phone string to the pattern (00) 00000-0000 or (00) 0000-0000
 * @param value - Phone string (may contain non-numeric characters)
 * @returns Formatted phone string
 */
export function formatPhone(value: string): string {
  if (!value) return ''

  const digits = value.replace(/\D/g, '')
  const limited = digits.slice(0, 11)

  if (limited.length <= 2) {
    return limited
  } else if (limited.length <= 6) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`
  } else if (limited.length <= 10) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`
  } else {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`
  }
}

export function validateCPF(cpf: string): boolean {
  if (!cpf) return false

  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) {
    return false
  }

  const calcCheckDigit = (base: number) => {
    let sum = 0
    for (let i = 0; i < base; i += 1) {
      sum += Number(digits[i]) * (base + 1 - i)
    }
    const result = (sum * 10) % 11
    return result === 10 ? 0 : result
  }

  const digit1 = calcCheckDigit(9)
  const digit2 = calcCheckDigit(10)

  return digit1 === Number(digits[9]) && digit2 === Number(digits[10])
}

/**
 * Debounce function to limit how often a function is called
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Handle keyboard navigation for lists and menus
 * @param event - Keyboard event
 * @param currentIndex - Current focused item index
 * @param itemCount - Total number of items
 * @param onSelect - Callback when item is selected (Enter/Space)
 * @returns New index to focus
 */
export function handleKeyboardNavigation(
  event: React.KeyboardEvent,
  currentIndex: number,
  itemCount: number,
  onSelect?: () => void
): number {
  let newIndex = currentIndex

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      newIndex = currentIndex + 1 >= itemCount ? 0 : currentIndex + 1
      break

    case 'ArrowUp':
      event.preventDefault()
      newIndex = currentIndex - 1 < 0 ? itemCount - 1 : currentIndex - 1
      break

    case 'Home':
      event.preventDefault()
      newIndex = 0
      break

    case 'End':
      event.preventDefault()
      newIndex = itemCount - 1
      break

    case 'Enter':
    case ' ':
      event.preventDefault()
      onSelect?.()
      break

    default:
      return currentIndex
  }

  return newIndex
}

/**
 * Build URL query string from filters object
 * @param filters - Filters object
 * @returns Query string (e.g., '?sport_type=corrida&city=sao-paulo')
 */
export function buildQueryString(filters: Record<string, any>): string {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value))
    }
  })

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

/**
 * Parse filters from Next.js searchParams
 * @param searchParams - Next.js searchParams object
 * @returns Typed filters object
 */
export function parseFiltersFromSearchParams(searchParams: {
  [key: string]: string | string[] | undefined
}): Record<string, any> {
  const filters: Record<string, any> = {}

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value === undefined || value === '') return

    const stringValue = Array.isArray(value) ? value[0] : value

    // Parse numbers for price and page
    if (key === 'min_price' || key === 'max_price' || key === 'page') {
      const numValue = Number(stringValue)
      if (!isNaN(numValue)) {
        filters[key] = numValue
      }
    } else {
      filters[key] = stringValue
    }
  })

  return filters
}

/**
 * Format price range as string
 * @param min - Minimum price
 * @param max - Maximum price
 * @returns Formatted price range string
 */
export function formatPriceRange(min?: number, max?: number): string {
  if (min !== undefined && max !== undefined) {
    return `${formatCurrency(min)} - ${formatCurrency(max)}`
  } else if (min !== undefined) {
    return `A partir de ${formatCurrency(min)}`
  } else if (max !== undefined) {
    return `Até ${formatCurrency(max)}`
  }
  return ''
}

/**
 * Format time from ISO date string
 * @param dateString - ISO date string
 * @returns Formatted time string (e.g., "7h00")
 */
export function formatTime(dateString: string): string {
  const match = dateString?.match(/T(\d{2}):(\d{2})/)

  if (match) {
    const hours = parseInt(match[1], 10)
    const minutes = match[2]

    if (!Number.isNaN(hours)) {
      return `${hours}h${minutes}`
    }
  }

  return '7h00' // Default time
}

/**
 * Extract location string from JSONB location object
 * @param location - Location JSONB object
 * @returns Formatted location string (e.g., "São Paulo, SP")
 */
export function extractLocationString(location: any): string {
  if (!location) return ''

  if (typeof location === 'string') {
    return location
  }

  const city = location.city || ''
  const state = location.state || ''

  if (city && state) {
    return `${city}, ${state}`
  }

  return city || state || ''
}

/**
 * Calculate current lot based on participants percentage
 * @param currentParticipants - Current number of participants
 * @param maxParticipants - Maximum number of participants (null/0 means unlimited capacity)
 * @returns Lot string (e.g., "1º lote", "2º lote", "3º lote", "Esgotado")
 */
export function calculateLot(currentParticipants: number, maxParticipants: number | null): string {
  // If maxParticipants is null or 0, event has unlimited capacity
  if (!maxParticipants || maxParticipants <= 0) {
    return '1º lote'
  }

  // If sold out
  if (currentParticipants >= maxParticipants) {
    return 'Esgotado'
  }

  // Handle negative edge case
  if (currentParticipants < 0) {
    return '1º lote'
  }

  const percentage = (currentParticipants / maxParticipants) * 100

  if (percentage <= 33) {
    return '1º lote'
  } else if (percentage <= 66) {
    return '2º lote'
  } else {
    return '3º lote'
  }
}

/**
 * Truncate text to maxLength characters
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text with "..." if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text
  }

  return text.substring(0, maxLength) + '...'
}

/**
 * Generates ICS file content for adding an event to calendars.
 */
export function generateICSFile(event: ICSEventData): string {
  const dtStamp = formatICSDate(new Date().toISOString())
  const dtStart = formatICSDate(event.startDate)
  const dtEnd = formatICSDate(event.endDate)

  if (!dtStart || !dtEnd) {
    throw new Error('Invalid dates provided for ICS generation')
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Symplepass//PT-BR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICS(event.title)}`,
    `DESCRIPTION:${escapeICS(event.description)}`,
    `LOCATION:${escapeICS(event.location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return lines.join('\r\n')
}

function formatICSDate(date: string) {
  const dateObj = new Date(date)
  if (Number.isNaN(dateObj.getTime())) {
    return ''
  }
  return dateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeICS(value: string) {
  return (value || '').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n')
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns True if password meets minimum requirements
 */
export function validatePassword(password: string): boolean {
  if (!password || password.length < 8) {
    return false
  }

  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)

  return hasUpper && hasNumber
}

/**
 * Get password strength indicator
 * @param password - Password to evaluate
 * @returns Strength level: 'weak', 'medium', or 'strong'
 */
export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (!password || password.length < 8) {
    return 'weak'
  }

  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length

  if (score >= 3 && password.length >= 12) {
    return 'strong'
  }

  if (score >= 2 && password.length >= 8) {
    return 'medium'
  }

  return 'weak'
}

/**
 * Convert array of objects to CSV string
 * @param data - Array of objects to convert
 * @param headers - Optional custom headers (defaults to object keys)
 * @returns CSV string
 *
 * @example
 * ```typescript
 * const data = [
 *   { nome: 'João', email: 'joao@example.com' },
 *   { nome: 'Maria', email: 'maria@example.com' }
 * ]
 * const csv = arrayToCSV(data)
 * // Returns: "nome,email\nJoão,joao@example.com\nMaria,maria@example.com"
 * ```
 */
export function arrayToCSV<T extends Record<string, any>>(
  data: T[],
  headers?: string[]
): string {
  if (data.length === 0) {
    return ''
  }

  const keys = headers || Object.keys(data[0])
  const headerRow = keys.join(',')

  const rows = data.map((item) => {
    return keys
      .map((key) => {
        const value = item[key]
        // Escape commas and quotes in CSV values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value ?? ''
      })
      .join(',')
  })

  return [headerRow, ...rows].join('\n')
}

/**
 * Trigger CSV download in browser
 * @param csvContent - CSV string content
 * @param filename - Name of the file to download
 *
 * @example
 * ```typescript
 * const csv = arrayToCSV(data)
 * downloadCSV(csv, 'inscricoes-2025.csv')
 * ```
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
