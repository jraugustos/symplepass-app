/**
 * Event Reminder Email Template
 * Sent to users 3 days before an event they're registered for
 */

import {
  generateBaseLayout,
  createButton,
  createInfoBox,
  EMAIL_COLORS,
  APP_URL,
} from './base-layout'

export interface EventReminderEmailData {
  userName: string
  userEmail: string
  eventTitle: string
  eventDate: string
  eventTime?: string
  eventLocation: string
  categoryName: string
  ticketCode: string
  qrCodeDataUrl?: string
  daysUntilEvent: number
  eventSlug: string
}

export function generateEventReminderEmailHtml({
  userName,
  eventTitle,
  eventDate,
  eventTime,
  eventLocation,
  categoryName,
  ticketCode,
  qrCodeDataUrl,
  daysUntilEvent,
  eventSlug,
}: EventReminderEmailData): string {
  const safeName = userName || 'Atleta'

  const urgencyText =
    daysUntilEvent === 0
      ? 'É hoje!'
      : daysUntilEvent === 1
        ? 'É amanhã!'
        : `Faltam ${daysUntilEvent} dias!`

  const urgencyEmoji = daysUntilEvent <= 1 ? '🔥' : '⏰'
  const urgencyBg = daysUntilEvent <= 1 ? EMAIL_COLORS.warningBg : EMAIL_COLORS.infoBg

  const content = `
    <!-- Heading -->
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;margin:0 auto 16px;background:${urgencyBg};border-radius:50%;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:32px;">${urgencyEmoji}</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:${EMAIL_COLORS.text};">
        ${urgencyText}
      </h1>
      <p style="margin:0;color:${EMAIL_COLORS.textMuted};font-size:16px;">
        ${safeName}, seu evento está chegando!
      </p>
    </div>

    <!-- Event details -->
    ${createInfoBox(`
      <p style="margin:0 0 4px;color:${EMAIL_COLORS.textLight};font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Detalhes do evento</p>
      <p style="margin:0;font-size:20px;font-weight:700;color:${EMAIL_COLORS.text};">${eventTitle}</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
        <tr>
          <td style="padding:4px 0;">
            <span style="color:${EMAIL_COLORS.textMuted};">📂</span>
            <span style="margin-left:8px;color:${EMAIL_COLORS.textMuted};">${categoryName}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:4px 0;">
            <span style="color:${EMAIL_COLORS.textMuted};">📅</span>
            <span style="margin-left:8px;color:${EMAIL_COLORS.textMuted};">${eventDate}${eventTime ? ` às ${eventTime}` : ''}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:4px 0;">
            <span style="color:${EMAIL_COLORS.textMuted};">📍</span>
            <span style="margin-left:8px;color:${EMAIL_COLORS.textMuted};">${eventLocation}</span>
          </td>
        </tr>
      </table>
    `)}

    <!-- QR Code -->
    <div style="text-align:center;margin-top:32px;padding:24px;background:${EMAIL_COLORS.background};border-radius:16px;border:1px solid ${EMAIL_COLORS.border};">
      <p style="margin:0 0 4px;color:${EMAIL_COLORS.textLight};font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Seu código de acesso</p>
      <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:${EMAIL_COLORS.primary};">${ticketCode}</p>
      ${
        qrCodeDataUrl
          ? `<img src="${qrCodeDataUrl}" alt="QR Code" width="180" height="180" style="display:block;margin:0 auto;width:180px;height:180px;border-radius:12px;border:1px solid ${EMAIL_COLORS.border};background:${EMAIL_COLORS.white};padding:8px;" />`
          : ''
      }
    </div>

    <!-- Checklist -->
    <div style="margin-top:32px;">
      ${createInfoBox(
        `
        <p style="margin:0 0 12px;font-weight:600;font-size:16px;color:${EMAIL_COLORS.text};">✅ Checklist para o dia</p>
        <ul style="padding-left:20px;margin:0;color:${EMAIL_COLORS.textMuted};line-height:2;">
          <li>Documento com foto (RG ou CNH)</li>
          <li>Este email ou QR Code no celular</li>
          <li>Chegue com 30 min de antecedência</li>
          <li>Roupa e equipamento adequados</li>
          <li>Hidratação e alimentação leve</li>
        </ul>
        `,
        'success'
      )}
    </div>

    <!-- CTA Buttons -->
    <div style="text-align:center;margin-top:32px;">
      ${createButton('Ver detalhes do evento', `${APP_URL}/eventos/${eventSlug}`)}
    </div>

    <div style="text-align:center;margin-top:16px;">
      <a href="${APP_URL}/conta#eventos" style="color:${EMAIL_COLORS.primary};text-decoration:none;font-size:14px;">
        Ver minha inscrição →
      </a>
    </div>

    <!-- Support note -->
    <div style="margin-top:32px;text-align:center;padding:16px;background-color:${EMAIL_COLORS.background};border-radius:12px;">
      <p style="margin:0;color:${EMAIL_COLORS.textMuted};font-size:14px;">
        Dúvidas? Entre em contato conosco em <a href="${APP_URL}/contato" style="color:${EMAIL_COLORS.primary};text-decoration:none;">symplepass.com/contato</a>
      </p>
    </div>
  `

  return generateBaseLayout({
    title: `${urgencyText} - ${eventTitle}`,
    previewText: `${safeName}, ${urgencyText.toLowerCase()} Seu evento ${eventTitle} está chegando. Confira os detalhes.`,
    content,
  })
}
