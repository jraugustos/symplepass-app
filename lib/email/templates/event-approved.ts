
import {
    generateBaseLayout,
    createButton,
    createInfoBox,
    createDetailRow,
    EMAIL_COLORS,
    APP_URL,
} from './base-layout'

interface EventApprovedEmailData {
    organizerName: string
    eventTitle: string
    eventSlug: string
    startDate: string
    serviceFee: number
}

export function generateEventApprovedHtml(data: EventApprovedEmailData): string {
    const { organizerName, eventTitle, eventSlug, startDate, serviceFee } = data

    const eventUrl = `${APP_URL}/eventos/${eventSlug}`
    const dashboardUrl = `${APP_URL}/admin/eventos`

    const content = `
    <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:${EMAIL_COLORS.text};text-align:center;">
      Evento Aprovado! 🎉
    </h1>
    
    <p style="margin:0 0 24px;font-size:16px;line-height:24px;color:${EMAIL_COLORS.textMuted};text-align:center;">
      Olá, <strong>${organizerName}</strong>! Temos ótimas notícias.
    </p>

    <p style="margin:0 0 32px;font-size:16px;line-height:24px;color:${EMAIL_COLORS.textMuted};text-align:center;">
      Seu evento <strong>"${eventTitle}"</strong> foi aprovado pela nossa equipe e já está disponível na plataforma.
    </p>

    <div style="margin-bottom:32px;">
      ${createInfoBox(
        `
        <p style="margin:0;font-weight:600;">O que acontece agora?</p>
        <p style="margin:8px 0 0;">Seu evento está com status <strong>Publicado</strong> e visível para todos os usuários.</p>
        `,
        'success'
    )}
    </div>

    <!-- Event Details -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
      ${createDetailRow('Evento', eventTitle)}
      ${createDetailRow('Data de Início', startDate)}
      ${createDetailRow('Taxa de Serviço', `${serviceFee}%`)}
    </table>

    <!-- Call to Action -->
    <div style="text-align:center;margin-bottom:32px;">
      ${createButton('Ver Evento Publicado', eventUrl)}
    </div>
    
    <p style="margin:0;font-size:14px;color:${EMAIL_COLORS.textLight};text-align:center;">
      ou acesse seu <a href="${dashboardUrl}" style="color:${EMAIL_COLORS.primary};text-decoration:none;">painel de eventos</a> para gerenciar inscritos.
    </p>
  `

    return generateBaseLayout({
        title: `Evento Aprovado: ${eventTitle}`,
        previewText: `Seu evento "${eventTitle}" foi aprovado e já está no ar!`,
        content,
    })
}
