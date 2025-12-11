/**
 * Photo Order Confirmation Email Template
 * Sent when a photo order payment is confirmed
 */

import {
  generateBaseLayout,
  createButton,
  createInfoBox,
  createDetailRow,
  EMAIL_COLORS,
} from './base-layout'
import { formatCurrency } from '@/lib/utils'
import type { EmailPhotoOrderConfirmationData } from '@/types'

/**
 * Generates HTML for photo order confirmation email
 */
export function generatePhotoOrderConfirmationEmailHtml(
  data: EmailPhotoOrderConfirmationData
): string {
  const {
    userName,
    eventTitle,
    eventDate,
    eventLocation,
    packageName,
    photoCount,
    totalAmount,
    downloadUrl,
    photos,
  } = data

  // Limit thumbnails displayed to 6
  const displayPhotos = photos.slice(0, 6)
  const remainingCount = photos.length - displayPhotos.length

  // Generate thumbnail grid
  const thumbnailsHtml =
    displayPhotos.length > 0
      ? `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:16px 0;">
      <tr>
        ${displayPhotos
          .map(
            (photo) => `
          <td style="width:${100 / Math.min(displayPhotos.length, 3)}%;padding:4px;vertical-align:top;">
            <img src="${photo.thumbnailUrl}" alt="${photo.file_name}"
                 style="width:100%;height:100px;object-fit:cover;border-radius:8px;border:1px solid ${EMAIL_COLORS.border};display:block;" />
          </td>
        `
          )
          .join('')}
      </tr>
      ${
        displayPhotos.length > 3
          ? `
      <tr>
        ${displayPhotos
          .slice(3)
          .map(
            (photo) => `
          <td style="width:${100 / Math.min(displayPhotos.length - 3, 3)}%;padding:4px;vertical-align:top;">
            <img src="${photo.thumbnailUrl}" alt="${photo.file_name}"
                 style="width:100%;height:100px;object-fit:cover;border-radius:8px;border:1px solid ${EMAIL_COLORS.border};display:block;" />
          </td>
        `
          )
          .join('')}
      </tr>
      `
          : ''
      }
    </table>
    ${
      remainingCount > 0
        ? `<p style="margin:0 0 16px;color:${EMAIL_COLORS.textMuted};font-size:14px;text-align:center;">+${remainingCount} ${remainingCount === 1 ? 'foto' : 'fotos'}</p>`
        : ''
    }
  `
      : ''

  const content = `
    <!-- Success heading -->
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">📸</span>
      <h1 style="margin:16px 0 8px;font-size:24px;font-weight:700;color:${EMAIL_COLORS.text};">
        Compra confirmada!
      </h1>
      <p style="margin:0;color:${EMAIL_COLORS.textMuted};font-size:16px;">
        Olá ${userName}, suas fotos estão prontas para download.
      </p>
    </div>

    <!-- Event info box -->
    ${createInfoBox(`
      <p style="margin:0 0 4px;font-size:12px;color:${EMAIL_COLORS.textMuted};text-transform:uppercase;letter-spacing:0.05em;">Evento</p>
      <p style="margin:0;font-size:16px;font-weight:600;color:${EMAIL_COLORS.text};">${eventTitle}</p>
      <p style="margin:4px 0 0;font-size:14px;color:${EMAIL_COLORS.textMuted};">${eventDate}</p>
      <p style="margin:4px 0 0;font-size:14px;color:${EMAIL_COLORS.textMuted};">${eventLocation}</p>
    `)}

    <!-- Order summary -->
    <div style="margin:24px 0;">
      <h2 style="margin:0 0 16px;font-size:16px;font-weight:600;color:${EMAIL_COLORS.text};">
        Resumo do pedido
      </h2>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        ${packageName ? createDetailRow('Pacote', packageName) : ''}
        ${createDetailRow('Quantidade', `${photoCount} ${photoCount === 1 ? 'foto' : 'fotos'}`)}
        ${createDetailRow('Valor total', formatCurrency(totalAmount))}
      </table>
    </div>

    <!-- Photo thumbnails -->
    ${
      thumbnailsHtml
        ? `
    <div style="margin:24px 0;">
      <h2 style="margin:0 0 8px;font-size:16px;font-weight:600;color:${EMAIL_COLORS.text};">
        Suas fotos
      </h2>
      ${thumbnailsHtml}
    </div>
    `
        : ''
    }

    <!-- Download info box -->
    ${createInfoBox(
      `
      <p style="margin:0;font-size:14px;font-weight:600;color:#065f46;">
        ✓ Suas fotos estão prontas para download em alta resolução, sem marca d'água.
      </p>
    `,
      'success'
    )}

    <!-- CTA button -->
    <div style="text-align:center;margin:32px 0;">
      ${createButton('Baixar minhas fotos', downloadUrl)}
    </div>

    <!-- Footer note -->
    <p style="margin:0;text-align:center;color:${EMAIL_COLORS.textMuted};font-size:12px;">
      O link de download estará disponível por 30 dias.
    </p>
  `

  return generateBaseLayout({
    title: `Fotos do ${eventTitle} - Download disponível`,
    previewText: `Suas ${photoCount} fotos do evento ${eventTitle} estão prontas para download.`,
    content,
  })
}
