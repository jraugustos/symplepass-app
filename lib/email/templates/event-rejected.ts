
import {
    generateBaseLayout,
    createButton,
    createInfoBox,
    createDetailRow,
    EMAIL_COLORS,
    APP_URL,
} from './base-layout'

interface EventRejectedEmailData {
    organizerName: string
    eventTitle: string
    eventId: string
    rejectionReason: string
    submittedAt: string
}

export function generateEventRejectedHtml(data: EventRejectedEmailData): string {
    const { organizerName, eventTitle, eventId, rejectionReason, submittedAt } = data

    const editEventUrl = `${APP_URL}/admin/eventos/${eventId}`

    const content = `
    <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:${EMAIL_COLORS.text};text-align:center;">
      Atualização sobre seu Evento
    </h1>
    
    <p style="margin:0 0 24px;font-size:16px;line-height:24px;color:${EMAIL_COLORS.textMuted};text-align:center;">
      Olá, <strong>${organizerName}</strong>.
    </p>

    <p style="margin:0 0 32px;font-size:16px;line-height:24px;color:${EMAIL_COLORS.textMuted};text-align:center;">
      Analisamos o evento <strong>"${eventTitle}"</strong> e infelizmente ele não pôde ser aprovado neste momento.
    </p>

    <!-- Rejection Reason -->
    <div style="margin-bottom:32px;">
      ${createInfoBox(
        `
        <p style="margin:0;font-weight:600;margin-bottom:8px;">Motivo da rejeição:</p>
        <p style="margin:0;">${rejectionReason}</p>
        `,
        'error'
    )}
    </div>

    <div style="margin-bottom:32px;">
      <p style="margin:0 0 16px;font-size:16px;color:${EMAIL_COLORS.textMuted};">
        Não desanime! Você pode ajustar as informações necessárias e submeter o evento novamente para análise.
      </p>
    </div>
    
    <!-- Event Details -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
      ${createDetailRow('Evento', eventTitle)}
      ${createDetailRow('Submetido em', submittedAt)}
    </table>

    <!-- Call to Action -->
    <div style="text-align:center;margin-bottom:32px;">
      ${createButton('Editar e Corrigir Evento', editEventUrl)}
    </div>
  `

    return generateBaseLayout({
        title: `Atenção: Evento ${eventTitle}`,
        previewText: `Precisamos de ajustes no seu evento "${eventTitle}". Veja o motivo.`,
        content,
    })
}
