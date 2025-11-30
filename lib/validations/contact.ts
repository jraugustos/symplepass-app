import { z } from 'zod'

export const contactSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter ao menos 2 caracteres')
    .max(255, 'Nome muito longo'),
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  phone: z
    .string()
    .max(20, 'Telefone muito longo')
    .optional()
    .nullable(),
  subject: z
    .string()
    .max(255, 'Assunto muito longo')
    .optional()
    .nullable(),
  message: z
    .string()
    .min(10, 'Mensagem deve ter ao menos 10 caracteres')
    .max(5000, 'Mensagem muito longa'),
})

export type ContactFormData = z.infer<typeof contactSchema>
