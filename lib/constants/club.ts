/**
 * Constantes relacionadas ao Clube de Benefícios Symplepass
 */

export const CLUB_DISCOUNT_PERCENTAGE = 10 as const

export const CLUB_MONTHLY_PRICE = 15 as const

export const CLUB_BENEFITS = [
  'Desconto de 10% em todas as inscrições',
  'Acesso antecipado a novos eventos',
  'Descontos em estabelecimentos parceiros',
  'Suporte prioritário via WhatsApp',
  'Acesso a eventos exclusivos do clube',
  'Cancele quando quiser, sem multa',
] as const

export const CLUB_RULES = {
  NON_CUMULATIVE_WITH_COUPONS: true,
  AUTO_APPLY_DISCOUNT: true,
  VALID_STATUSES: ['active', 'trialing'] as const,
} as const
