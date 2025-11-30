/**
 * Contact Form Notification Email Template
 * Sent to admin when someone submits the contact form
 */

import {
  generateBaseLayout,
  createButton,
  createInfoBox,
  createDetailRow,
  EMAIL_COLORS,
} from './base-layout'

export interface ContactNotificationData {
  name: string
  email: string
  phone?: string | null
  subject?: string | null
  message: string
  submittedAt: string
}

export function generateContactNotificationEmailHtml(data: ContactNotificationData): string {
  const { name, email, phone, subject, message, submittedAt } = data

  const content = `
    <!-- Heading -->
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;margin:0 auto 16px;background:${EMAIL_COLORS.infoBg};border-radius:50%;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:32px;">📩</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:${EMAIL_COLORS.text};">
        Nova mensagem de contato
      </h1>
      <p style="margin:0;color:${EMAIL_COLORS.textMuted};font-size:14px;">
        Recebida em ${submittedAt}
      </p>
    </div>

    <!-- Contact Info -->
    ${createInfoBox(`
      <table width="100%" cellpadding="0" cellspacing="0">
        ${createDetailRow('Nome', name)}
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid ${EMAIL_COLORS.border};">
            <p style="margin:0;color:${EMAIL_COLORS.textLight};font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Email</p>
            <p style="margin:4px 0 0;">
              <a href="mailto:${email}" style="color:${EMAIL_COLORS.primary};text-decoration:none;font-weight:600;">${email}</a>
            </p>
          </td>
        </tr>
        ${phone ? createDetailRow('Telefone', phone) : ''}
        ${subject ? `
        <tr>
          <td style="padding:8px 0;">
            <p style="margin:0;color:${EMAIL_COLORS.textLight};font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Assunto</p>
            <p style="margin:4px 0 0;color:${EMAIL_COLORS.text};font-weight:600;">${subject}</p>
          </td>
        </tr>
        ` : ''}
      </table>
    `)}

    <!-- Message -->
    <div style="margin-top:24px;">
      <p style="margin:0 0 8px;color:${EMAIL_COLORS.textLight};font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Mensagem</p>
      <div style="background:${EMAIL_COLORS.white};border:1px solid ${EMAIL_COLORS.border};border-radius:12px;padding:16px;">
        <p style="margin:0;font-size:15px;color:${EMAIL_COLORS.text};line-height:1.6;white-space:pre-wrap;">${message}</p>
      </div>
    </div>

    <!-- Reply CTA -->
    <div style="text-align:center;margin-top:32px;">
      ${createButton('Responder', `mailto:${email}?subject=Re: ${subject || 'Contato Symplepass'}`)}
    </div>

    <!-- Footer note -->
    <div style="margin-top:24px;text-align:center;">
      <p style="margin:0;color:${EMAIL_COLORS.textLight};font-size:12px;">
        Esta é uma notificação automática do formulário de contato.
      </p>
    </div>
  `

  return generateBaseLayout({
    title: 'Nova mensagem de contato - Symplepass',
    previewText: `${name} enviou uma mensagem: ${subject || message.slice(0, 50)}...`,
    content,
    showFooterLinks: false,
  })
}
