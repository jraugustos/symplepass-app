import { z } from 'zod'

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  password: z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

export type LoginFormData = z.infer<typeof loginSchema>

/**
 * Register form validation schema
 */
export const registerSchema = z.object({
  fullName: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo'),
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
  confirmPassword: z
    .string()
    .min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

export type RegisterFormData = z.infer<typeof registerSchema>

/**
 * Reset password form validation schema
 */
export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
})

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

/**
 * Reusable password validation schema
 */
const passwordValidation = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um número')

/**
 * Update password form validation schema
 */
export const updatePasswordSchema = z.object({
  newPassword: passwordValidation,
  confirmNewPassword: z
    .string()
    .min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmNewPassword'],
})

export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>

const brazilPhoneRegex = /^\+?55?\s?\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/
const brazilCPFRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/

export const profileUpdateSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(120, 'Nome muito longo')
    .optional(),
  phone: z
    .string()
    .optional()
    .refine((value) => !value || brazilPhoneRegex.test(value.replace(/\s/g, '')), {
      message: 'Telefone inválido',
    }),
  date_of_birth: z
    .string()
    .optional()
    .refine((value) => {
      if (!value) return true
      const date = new Date(value)
      if (isNaN(date.getTime())) return false
      const today = new Date()
      const adultDate = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate()
      )
      return date <= adultDate
    }, 'Você precisa ter pelo menos 18 anos'),
  gender: z
    .enum(['masculino', 'feminino', 'nao_informado', 'outro'])
    .optional(),
})

export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(6, 'Senha atual é obrigatória'),
  newPassword: passwordValidation,
})

export type PasswordChangeData = z.infer<typeof passwordChangeSchema>

export const deleteAccountSchema = z.object({
  password: z.string().min(6, 'Senha é obrigatória'),
})

export type DeleteAccountData = z.infer<typeof deleteAccountSchema>

export const organizerProfileSchema = z.object({
  company_name: z
    .string()
    .min(1, 'Nome da empresa é obrigatório')
    .max(200, 'Nome muito longo'),
  cnpj: z
    .string()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido (formato: 00.000.000/0000-00)')
    .nullable()
    .optional(),
  description: z
    .string()
    .max(1000, 'Descrição muito longa (máximo 1000 caracteres)')
    .nullable()
    .optional(),
  logo_url: z
    .string()
    .url('URL inválida')
    .nullable()
    .optional(),
  website: z
    .string()
    .url('URL inválida')
    .nullable()
    .optional(),
  contact_email: z
    .string()
    .email('Email inválido')
    .nullable()
    .optional(),
})

export type OrganizerProfileInput = z.infer<typeof organizerProfileSchema>

/**
 * Partner data validation schema
 */
export const partnerDataSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo'),
  email: z
    .string()
    .email('Email inválido'),
  cpf: z
    .string()
    .regex(brazilCPFRegex, 'CPF inválido'),
  phone: z
    .string()
    .regex(brazilPhoneRegex, 'Telefone inválido'),
  shirtSize: z
    .string()
    .min(1, 'Tamanho da camiseta é obrigatório'),
})

export type PartnerDataInput = z.infer<typeof partnerDataSchema>

/**
 * Helper function to validate form data with a schema
 */
export function validateFormData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {}
      error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message
        }
      })
      return { success: false, errors }
    }
    return { success: false, errors: { _form: 'Erro ao validar dados' } }
  }
}
