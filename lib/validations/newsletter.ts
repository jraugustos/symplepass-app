import { z } from 'zod'

export const newsletterSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  source: z
    .enum(['footer', 'modal', 'checkout'])
    .default('footer'),
})

export type NewsletterFormData = z.infer<typeof newsletterSchema>
