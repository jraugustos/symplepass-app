/**
 * Registration Confirmation Email Template
 * Sent when a user successfully registers for an event
 */

import type { EmailConfirmationData } from '@/types'
import {
  generateBaseLayout,
  createInfoBox,
  createDetailRow,
  EMAIL_COLORS,
  APP_URL,
} from './templates/base-layout'

export function generateConfirmationEmailHtml({
  userName,
  eventTitle,
  eventDate,
  eventLocation,
  categoryName,
  qrCodeDataUrl,
  ticketCode,
  qrMissingNote,
  partnerData,
}: EmailConfirmationData) {
  const safeName = userName || 'Atleta'

  const partnerSection = partnerData
    ? `
    <!-- Partner data -->
    <div style="margin-top:24px;">
      ${createInfoBox(
        `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
          <span style="font-size:20px;">👥</span>
          <p style="margin:0;color:${EMAIL_COLORS.primary};font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Dados do Parceiro(a)</p>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${createDetailRow('Nome', partnerData.name)}
          ${createDetailRow('Email', partnerData.email)}
          ${createDetailRow('CPF', partnerData.cpf)}
          ${createDetailRow('Telefone', partnerData.phone)}
          <tr>
            <td style="padding:8px 0;">
              <p style="margin:0;color:${EMAIL_COLORS.textLight};font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Tamanho da camiseta</p>
              <p style="margin:4px 0 0;color:${EMAIL_COLORS.text};font-weight:600;">${partnerData.shirtSize}</p>
            </td>
          </tr>
        </table>
        `,
        'warning'
      )}
    </div>
    `
    : ''

  const content = `
    <!-- Success heading -->
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;margin:0 auto 16px;background:${EMAIL_COLORS.successBg};border-radius:50%;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:32px;">✅</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:${EMAIL_COLORS.text};">
        Inscrição confirmada!
      </h1>
      <p style="margin:0;color:${EMAIL_COLORS.textMuted};font-size:16px;">
        ${safeName}, seu ingresso para <strong>${eventTitle}</strong> está garantido.
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
            <span style="margin-left:8px;color:${EMAIL_COLORS.textMuted};">${eventDate}</span>
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

    ${partnerSection}

    <!-- QR Code -->
    <div style="text-align:center;margin-top:32px;padding:24px;background:${EMAIL_COLORS.background};border-radius:16px;border:1px solid ${EMAIL_COLORS.border};">
      <p style="margin:0 0 4px;color:${EMAIL_COLORS.textLight};font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Apresente no credenciamento</p>
      <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:${EMAIL_COLORS.primary};">${ticketCode}</p>
      ${
        qrCodeDataUrl
          ? `<img src="${qrCodeDataUrl}" alt="QR Code" width="200" height="200" style="display:block;margin:0 auto;width:200px;height:200px;border-radius:16px;border:1px solid ${EMAIL_COLORS.border};background:${EMAIL_COLORS.white};padding:8px;" />`
          : `<div style="width:200px;height:200px;margin:0 auto;border-radius:16px;border:2px dashed ${EMAIL_COLORS.border};display:flex;align-items:center;justify-content:center;color:${EMAIL_COLORS.textLight};">QR Code indisponível</div>`
      }
    </div>

    ${
      qrMissingNote
        ? `
    <div style="margin-top:16px;padding:12px 16px;background:${EMAIL_COLORS.warningBg};border-radius:8px;border-left:4px solid ${EMAIL_COLORS.warning};">
      <p style="margin:0;color:#92400e;font-size:14px;">${qrMissingNote}</p>
    </div>
    `
        : ''
    }

    <!-- Next steps -->
    <div style="margin-top:32px;">
      <p style="margin:0 0 12px;font-weight:600;font-size:16px;color:${EMAIL_COLORS.text};">📋 Próximos passos</p>
      <ul style="padding-left:20px;margin:0;color:${EMAIL_COLORS.textMuted};line-height:1.8;">
        <li>Apresente este QR Code para retirar o kit atleta</li>
        <li>Chegue com 30 minutos de antecedência no dia do evento</li>
        <li>Leve um documento com foto para validação</li>
      </ul>
    </div>

    <!-- View registration button -->
    <div style="text-align:center;margin-top:32px;">
      <a href="${APP_URL}/conta#eventos" style="display:inline-block;padding:14px 32px;background:${EMAIL_COLORS.primaryGradient};color:${EMAIL_COLORS.white};text-decoration:none;border-radius:12px;font-weight:600;font-size:16px;">
        Ver minha inscrição
      </a>
    </div>
  `

  return generateBaseLayout({
    title: `Inscrição confirmada - ${eventTitle}`,
    previewText: `${safeName}, sua inscrição para ${eventTitle} foi confirmada! Código: ${ticketCode}`,
    content,
  })
}
