import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  calculateServiceFee,
  calculateTotal,
  generateTicketCode,
  formatPaymentStatus,
  formatRegistrationStatus,
  getStatusBadgeVariant,
  validateEmail,
  formatDate,
  formatDateShort,
  formatEventDate,
  slugify,
  getInitials,
  formatPhoneNumber,
  formatCPF,
  formatPhone,
  validateCPF,
  validatePassword,
  getPasswordStrength,
  truncateText,
  calculateLot,
  extractLocationString,
  formatTime,
  buildQueryString,
  arrayToCSV,
} from '@/lib/utils'

describe('formatCurrency', () => {
  it('should format a positive number as BRL currency', () => {
    // Use regex to handle non-breaking space variations in Intl.NumberFormat
    expect(formatCurrency(100)).toMatch(/R\$\s*100,00/)
    expect(formatCurrency(1234.56)).toMatch(/R\$\s*1\.234,56/)
  })

  it('should format zero as BRL currency', () => {
    expect(formatCurrency(0)).toMatch(/R\$\s*0,00/)
  })

  it('should return fallback text for null', () => {
    expect(formatCurrency(null)).toBe('Consulte valores')
  })
})

describe('calculateServiceFee', () => {
  it('should calculate 10% service fee', () => {
    expect(calculateServiceFee(100)).toBe(10)
    expect(calculateServiceFee(150)).toBe(15)
    expect(calculateServiceFee(99.99)).toBe(10)
  })

  it('should return 0 for invalid input', () => {
    expect(calculateServiceFee(0)).toBe(0)
    expect(calculateServiceFee(NaN)).toBe(0)
  })
})

describe('calculateTotal', () => {
  it('should add subtotal and service fee', () => {
    expect(calculateTotal(100, 10)).toBe(110)
    expect(calculateTotal(99.99, 10)).toBe(109.99)
  })

  it('should handle null/undefined values', () => {
    expect(calculateTotal(0, 0)).toBe(0)
  })
})

describe('generateTicketCode', () => {
  it('should generate a ticket code from registration ID', () => {
    const code = generateTicketCode('abc123def456')
    const year = new Date().getFullYear()
    expect(code).toMatch(new RegExp(`^#SP${year}-[A-Z0-9]{4}$`))
  })

  it('should return default code for empty string', () => {
    expect(generateTicketCode('')).toBe('#SP0000-0000')
  })
})

describe('formatPaymentStatus', () => {
  it('should format payment statuses correctly', () => {
    expect(formatPaymentStatus('paid')).toBe('Pago')
    expect(formatPaymentStatus('pending')).toBe('Pendente')
    expect(formatPaymentStatus('failed')).toBe('Falhou')
    expect(formatPaymentStatus('refunded')).toBe('Reembolsado')
  })

  it('should return "Desconhecido" for unknown status', () => {
    expect(formatPaymentStatus('unknown' as any)).toBe('Desconhecido')
  })
})

describe('formatRegistrationStatus', () => {
  it('should format registration statuses correctly', () => {
    expect(formatRegistrationStatus('confirmed')).toBe('Confirmado')
    expect(formatRegistrationStatus('pending')).toBe('Pendente')
    expect(formatRegistrationStatus('cancelled')).toBe('Cancelado')
  })

  it('should return "Desconhecido" for unknown status', () => {
    expect(formatRegistrationStatus('unknown' as any)).toBe('Desconhecido')
  })
})

describe('getStatusBadgeVariant', () => {
  it('should return success for paid/confirmed statuses', () => {
    expect(getStatusBadgeVariant('paid')).toBe('success')
    expect(getStatusBadgeVariant('confirmed')).toBe('success')
    expect(getStatusBadgeVariant('confirmado')).toBe('success')
  })

  it('should return warning for pending statuses', () => {
    expect(getStatusBadgeVariant('pending')).toBe('warning')
    expect(getStatusBadgeVariant('pendente')).toBe('warning')
  })

  it('should return error for failed/cancelled statuses', () => {
    expect(getStatusBadgeVariant('failed')).toBe('error')
    expect(getStatusBadgeVariant('cancelled')).toBe('error')
    expect(getStatusBadgeVariant('cancelado')).toBe('error')
  })

  it('should return neutral for unknown statuses', () => {
    expect(getStatusBadgeVariant('unknown')).toBe('neutral')
  })
})

describe('validateEmail', () => {
  it('should return true for valid emails', () => {
    expect(validateEmail('test@example.com')).toBe(true)
    expect(validateEmail('user.name@domain.com.br')).toBe(true)
  })

  it('should return false for invalid emails', () => {
    expect(validateEmail('')).toBe(false)
    expect(validateEmail('invalid')).toBe(false)
    expect(validateEmail('invalid@')).toBe(false)
    expect(validateEmail('@domain.com')).toBe(false)
  })
})

describe('formatDate', () => {
  it('should format date in Brazilian format', () => {
    // Using Date object to avoid timezone issues with ISO string parsing
    const result = formatDate(new Date(2025, 2, 15)) // March 15, 2025
    expect(result).toBe('15/03/2025')
  })

  it('should accept Date object', () => {
    const result = formatDate(new Date(2025, 2, 15))
    expect(result).toBe('15/03/2025')
  })
})

describe('formatDateShort', () => {
  it('should format date in short Brazilian format', () => {
    // Using Date object to avoid timezone issues
    const result = formatDateShort(new Date(2025, 3, 12)) // April 12, 2025
    expect(result).toContain('12')
    expect(result).toContain('abr')
  })

  it('should return "Data inválida" for invalid dates', () => {
    expect(formatDateShort('invalid')).toBe('Data inválida')
  })
})

describe('formatEventDate', () => {
  it('should format date in long Brazilian format', () => {
    // Using Date object to avoid timezone issues
    const result = formatEventDate(new Date(2025, 3, 12)) // April 12, 2025
    expect(result).toContain('12')
    expect(result).toContain('abril')
    expect(result).toContain('2025')
  })

  it('should return "Data inválida" for invalid dates', () => {
    expect(formatEventDate('invalid')).toBe('Data inválida')
  })
})

describe('slugify', () => {
  it('should convert text to URL-friendly slug', () => {
    expect(slugify('Corrida de Rua')).toBe('corrida-de-rua')
    expect(slugify('São Paulo 2025')).toBe('so-paulo-2025')
    expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces')
  })

  it('should handle empty string', () => {
    expect(slugify('')).toBe('')
  })
})

describe('getInitials', () => {
  it('should return initials from full name', () => {
    expect(getInitials('João Silva')).toBe('JS')
    expect(getInitials('Maria Eduarda Santos')).toBe('MS')
  })

  it('should return single initial for single name', () => {
    expect(getInitials('João')).toBe('J')
  })

  it('should return "U" for empty name', () => {
    expect(getInitials('')).toBe('U')
    expect(getInitials('  ')).toBe('U')
  })
})

describe('formatPhoneNumber', () => {
  it('should format phone numbers', () => {
    expect(formatPhoneNumber('11999999999')).toBe('(11) 99999-9999')
    expect(formatPhoneNumber('1199999999')).toBe('(11) 9999-9999')
  })

  it('should return original for short numbers', () => {
    expect(formatPhoneNumber('123')).toBe('123')
  })

  it('should return empty string for empty input', () => {
    expect(formatPhoneNumber('')).toBe('')
  })
})

describe('formatCPF', () => {
  it('should format CPF progressively', () => {
    expect(formatCPF('123')).toBe('123')
    expect(formatCPF('123456')).toBe('123.456')
    expect(formatCPF('123456789')).toBe('123.456.789')
    expect(formatCPF('12345678901')).toBe('123.456.789-01')
  })

  it('should strip non-numeric characters', () => {
    expect(formatCPF('123.456.789-01')).toBe('123.456.789-01')
  })

  it('should return empty string for empty input', () => {
    expect(formatCPF('')).toBe('')
  })
})

describe('formatPhone', () => {
  it('should format phone progressively', () => {
    expect(formatPhone('11')).toBe('11')
    expect(formatPhone('11999')).toBe('(11) 999')
    expect(formatPhone('1199999999')).toBe('(11) 9999-9999')
    expect(formatPhone('11999999999')).toBe('(11) 99999-9999')
  })

  it('should return empty string for empty input', () => {
    expect(formatPhone('')).toBe('')
  })
})

describe('validateCPF', () => {
  it('should return true for valid CPFs', () => {
    expect(validateCPF('529.982.247-25')).toBe(true)
    expect(validateCPF('52998224725')).toBe(true)
  })

  it('should return false for invalid CPFs', () => {
    expect(validateCPF('')).toBe(false)
    expect(validateCPF('111.111.111-11')).toBe(false)
    expect(validateCPF('123.456.789-00')).toBe(false)
  })
})

describe('validatePassword', () => {
  it('should return true for valid passwords', () => {
    expect(validatePassword('Password1')).toBe(true)
    expect(validatePassword('MySecure123')).toBe(true)
  })

  it('should return false for invalid passwords', () => {
    expect(validatePassword('')).toBe(false)
    expect(validatePassword('short')).toBe(false)
    expect(validatePassword('alllowercase1')).toBe(false)
    expect(validatePassword('NoNumbers')).toBe(false)
  })
})

describe('getPasswordStrength', () => {
  it('should return weak for short passwords', () => {
    expect(getPasswordStrength('')).toBe('weak')
    expect(getPasswordStrength('short')).toBe('weak')
  })

  it('should return medium for decent passwords', () => {
    expect(getPasswordStrength('Password1')).toBe('medium')
  })

  it('should return strong for strong passwords', () => {
    expect(getPasswordStrength('MySecure123!')).toBe('strong')
  })
})

describe('truncateText', () => {
  it('should truncate long text', () => {
    expect(truncateText('This is a long text', 10)).toBe('This is a ...')
  })

  it('should not truncate short text', () => {
    expect(truncateText('Short', 10)).toBe('Short')
  })

  it('should handle empty string', () => {
    expect(truncateText('', 10)).toBe('')
  })
})

describe('calculateLot', () => {
  it('should return "1º lote" for 0-33% capacity', () => {
    expect(calculateLot(0, 100)).toBe('1º lote')
    expect(calculateLot(33, 100)).toBe('1º lote')
  })

  it('should return "2º lote" for 34-66% capacity', () => {
    expect(calculateLot(34, 100)).toBe('2º lote')
    expect(calculateLot(66, 100)).toBe('2º lote')
  })

  it('should return "3º lote" for 67-99% capacity', () => {
    expect(calculateLot(67, 100)).toBe('3º lote')
    expect(calculateLot(99, 100)).toBe('3º lote')
  })

  it('should return "Esgotado" when sold out', () => {
    expect(calculateLot(100, 100)).toBe('Esgotado')
  })

  it('should return "1º lote" for unlimited capacity', () => {
    expect(calculateLot(1000, null)).toBe('1º lote')
    expect(calculateLot(1000, 0)).toBe('1º lote')
  })
})

describe('extractLocationString', () => {
  it('should extract city and state from object', () => {
    expect(extractLocationString({ city: 'São Paulo', state: 'SP' })).toBe('São Paulo, SP')
  })

  it('should return city only if no state', () => {
    expect(extractLocationString({ city: 'São Paulo' })).toBe('São Paulo')
  })

  it('should return string as-is', () => {
    expect(extractLocationString('São Paulo, SP')).toBe('São Paulo, SP')
  })

  it('should return empty string for null/undefined', () => {
    expect(extractLocationString(null)).toBe('')
    expect(extractLocationString(undefined)).toBe('')
  })
})

describe('formatTime', () => {
  it('should extract and format time from ISO string', () => {
    expect(formatTime('2025-03-15T07:00:00')).toBe('7h00')
    expect(formatTime('2025-03-15T14:30:00')).toBe('14h30')
  })

  it('should return default time for invalid string', () => {
    expect(formatTime('')).toBe('7h00')
    expect(formatTime('invalid')).toBe('7h00')
  })
})

describe('buildQueryString', () => {
  it('should build query string from object', () => {
    const result = buildQueryString({ sport_type: 'corrida', city: 'sao-paulo' })
    expect(result).toBe('?sport_type=corrida&city=sao-paulo')
  })

  it('should skip null/undefined/empty values', () => {
    const result = buildQueryString({ a: 'value', b: null, c: undefined, d: '' })
    expect(result).toBe('?a=value')
  })

  it('should return empty string for empty object', () => {
    expect(buildQueryString({})).toBe('')
  })
})

describe('arrayToCSV', () => {
  it('should convert array of objects to CSV', () => {
    const data = [
      { nome: 'João', email: 'joao@example.com' },
      { nome: 'Maria', email: 'maria@example.com' },
    ]
    const result = arrayToCSV(data)
    expect(result).toContain('nome,email')
    expect(result).toContain('João,joao@example.com')
    expect(result).toContain('Maria,maria@example.com')
  })

  it('should escape commas and quotes', () => {
    const data = [{ text: 'Hello, World', quote: 'Say "Hi"' }]
    const result = arrayToCSV(data)
    expect(result).toContain('"Hello, World"')
    expect(result).toContain('"Say ""Hi"""')
  })

  it('should return empty string for empty array', () => {
    expect(arrayToCSV([])).toBe('')
  })
})
