/**
 * Welcome Email Template
 * Sent when a user creates a new account
 */

import {
  generateBaseLayout,
  createButton,
  createInfoBox,
  EMAIL_COLORS,
  APP_URL,
} from './base-layout'

export interface WelcomeEmailData {
  userName: string
  userEmail: string
}

export function generateWelcomeEmailHtml({ userName, userEmail }: WelcomeEmailData): string {
  const safeName = userName || 'Atleta'

  const content = `
    <!-- Welcome heading -->
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;margin:0 auto 16px;background:${EMAIL_COLORS.successBg};border-radius:50%;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:32px;">🎉</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:${EMAIL_COLORS.text};">
        Bem-vindo, ${safeName}!
      </h1>
      <p style="margin:0;color:${EMAIL_COLORS.textMuted};font-size:16px;">
        Sua conta foi criada com sucesso. Agora você pode explorar e se inscrever nos melhores eventos esportivos.
      </p>
    </div>

    <!-- Features -->
    ${createInfoBox(`
      <p style="margin:0 0 16px;font-weight:600;font-size:16px;color:${EMAIL_COLORS.text};">O que você pode fazer:</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${EMAIL_COLORS.border};">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:40px;vertical-align:top;">
                  <span style="font-size:24px;">🏃</span>
                </td>
                <td style="padding-left:12px;">
                  <p style="margin:0;font-weight:600;color:${EMAIL_COLORS.text};">Explorar eventos</p>
                  <p style="margin:4px 0 0;color:${EMAIL_COLORS.textMuted};font-size:14px;">Encontre corridas, ciclismo, triatlo e muito mais</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${EMAIL_COLORS.border};">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:40px;vertical-align:top;">
                  <span style="font-size:24px;">🎫</span>
                </td>
                <td style="padding-left:12px;">
                  <p style="margin:0;font-weight:600;color:${EMAIL_COLORS.text};">Inscrição simplificada</p>
                  <p style="margin:4px 0 0;color:${EMAIL_COLORS.textMuted};font-size:14px;">Processo rápido e seguro com pagamento online</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:40px;vertical-align:top;">
                  <span style="font-size:24px;">📱</span>
                </td>
                <td style="padding-left:12px;">
                  <p style="margin:0;font-weight:600;color:${EMAIL_COLORS.text};">QR Code digital</p>
                  <p style="margin:4px 0 0;color:${EMAIL_COLORS.textMuted};font-size:14px;">Acesse seu ingresso direto no celular</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `)}

    <!-- CTA Button -->
    <div style="text-align:center;margin:32px 0;">
      ${createButton('Explorar eventos', `${APP_URL}/eventos`)}
    </div>

    <!-- Account info -->
    <div style="text-align:center;padding:16px;background-color:${EMAIL_COLORS.background};border-radius:12px;">
      <p style="margin:0;color:${EMAIL_COLORS.textLight};font-size:14px;">
        Sua conta está vinculada ao email:
      </p>
      <p style="margin:4px 0 0;font-weight:600;color:${EMAIL_COLORS.text};">
        ${userEmail}
      </p>
    </div>
  `

  return generateBaseLayout({
    title: 'Bem-vindo ao Symplepass!',
    previewText: `${safeName}, sua conta foi criada com sucesso. Explore os melhores eventos esportivos!`,
    content,
  })
}
