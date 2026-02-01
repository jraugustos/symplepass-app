
import {
    generateBaseLayout,
    createButton,
    createDetailRow,
    EMAIL_COLORS,
    APP_URL,
} from './base-layout'

interface AdminNewEventEmailData {
    eventName: string
    organizerName: string
    submittedAt: string
}

export function generateAdminNewEventHtml(data: AdminNewEventEmailData): string {
    const { eventName, organizerName, submittedAt } = data

    const approvalsUrl = `${APP_URL}/admin/aprovacoes`

    const content = `
    <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:${EMAIL_COLORS.text};text-align:center;">
      Novo Evento Pendente 🔔
    </h1>
    
    <p style="margin:0 0 24px;font-size:16px;line-height:24px;color:${EMAIL_COLORS.textMuted};text-align:center;">
      Um novo evento foi criado e aguarda aprovação.
    </p>

    <!-- Event Details -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
      ${createDetailRow('Evento', eventName)}
      ${createDetailRow('Organizador', organizerName)}
      ${createDetailRow('Criado em', submittedAt)}
    </table>

    <!-- Call to Action -->
    <div style="text-align:center;margin-bottom:32px;">
      ${createButton('Revisar Aprovações', approvalsUrl)}
    </div>
  `

    return generateBaseLayout({
        title: `Novo Evento Pendente: ${eventName}`,
        previewText: `O organizador ${organizerName} criou o evento "${eventName}".`,
        content,
    })
}
