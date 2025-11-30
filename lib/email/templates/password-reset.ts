/**
 * Password Reset Email Template
 * Sent when a user requests to reset their password
 */

import {
  generateBaseLayout,
  createButton,
  createInfoBox,
  EMAIL_COLORS,
} from './base-layout'

export interface PasswordResetEmailData {
  userName: string
  userEmail: string
  resetLink: string
}

export function generatePasswordResetEmailHtml({
  userName,
  userEmail,
  resetLink,
}: PasswordResetEmailData): string {
  const safeName = userName || 'Usuário'

  const content = `
    <!-- Heading -->
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;margin:0 auto 16px;background:${EMAIL_COLORS.infoBg};border-radius:50%;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:32px;">🔐</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:${EMAIL_COLORS.text};">
        Redefinir senha
      </h1>
      <p style="margin:0;color:${EMAIL_COLORS.textMuted};font-size:16px;">
        Olá ${safeName}, recebemos uma solicitação para redefinir a senha da sua conta.
      </p>
    </div>

    <!-- CTA Button -->
    <div style="text-align:center;margin:32px 0;">
      ${createButton('Redefinir minha senha', resetLink)}
    </div>

    <!-- Warning info -->
    ${createInfoBox(
      `
      <p style="margin:0 0 8px;font-weight:600;color:${EMAIL_COLORS.text};">⚠️ Importante</p>
      <ul style="padding-left:20px;margin:0;color:${EMAIL_COLORS.textMuted};font-size:14px;line-height:1.8;">
        <li>Este link expira em <strong>1 hora</strong></li>
        <li>Se você não solicitou esta redefinição, ignore este email</li>
        <li>Sua senha atual permanecerá inalterada</li>
      </ul>
      `,
      'warning'
    )}

    <!-- Account info -->
    <div style="margin-top:24px;text-align:center;padding:16px;background-color:${EMAIL_COLORS.background};border-radius:12px;">
      <p style="margin:0;color:${EMAIL_COLORS.textLight};font-size:14px;">
        Conta associada:
      </p>
      <p style="margin:4px 0 0;font-weight:600;color:${EMAIL_COLORS.text};">
        ${userEmail}
      </p>
    </div>

    <!-- Alternative link -->
    <div style="margin-top:24px;padding:16px;background-color:${EMAIL_COLORS.background};border-radius:12px;">
      <p style="margin:0 0 8px;color:${EMAIL_COLORS.textMuted};font-size:14px;">
        Se o botão não funcionar, copie e cole este link no seu navegador:
      </p>
      <p style="margin:0;word-break:break-all;font-size:12px;color:${EMAIL_COLORS.info};">
        ${resetLink}
      </p>
    </div>
  `

  return generateBaseLayout({
    title: 'Redefinir sua senha - Symplepass',
    previewText: `${safeName}, clique aqui para redefinir sua senha do Symplepass`,
    content,
  })
}
