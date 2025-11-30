/**
 * Base Email Layout
 * Shared layout for all transactional emails with consistent branding
 */

// Brand colors from tailwind config
export const EMAIL_COLORS = {
  // Primary (Orange)
  primary: '#f97316',
  primaryLight: '#fb923c',
  primaryDark: '#ea580c',
  primaryGradient: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)',

  // Neutrals
  text: '#0f172a',
  textMuted: '#475569',
  textLight: '#94a3b8',
  border: '#e2e8f0',
  background: '#f8fafc',
  white: '#ffffff',

  // Semantic
  success: '#10b981',
  successBg: '#ecfdf5',
  error: '#ef4444',
  errorBg: '#fef2f2',
  warning: '#f59e0b',
  warningBg: '#fffbeb',
  info: '#0ea5e9',
  infoBg: '#f0f9ff',
} as const

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://symplepass.com'
export const LOGO_URL = `${APP_URL}/assets/symplepass-color.svg`
export const CURRENT_YEAR = new Date().getFullYear()

interface BaseLayoutOptions {
  title: string
  previewText?: string
  content: string
  showFooterLinks?: boolean
}

/**
 * Generates the base HTML layout for all emails
 */
export function generateBaseLayout({
  title,
  previewText,
  content,
  showFooterLinks = true,
}: BaseLayoutOptions): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>${title}</title>
    ${previewText ? `<!--[if !mso]><!--><meta name="x-apple-disable-message-reformatting" /><!--<![endif]-->` : ''}
    <style>
      /* Reset styles */
      body, table, td, p, a, li, blockquote {
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      table, td {
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
      }
      img {
        -ms-interpolation-mode: bicubic;
        border: 0;
        height: auto;
        line-height: 100%;
        outline: none;
        text-decoration: none;
      }
      /* Custom styles */
      body {
        margin: 0;
        padding: 0;
        width: 100% !important;
        height: 100% !important;
        background-color: ${EMAIL_COLORS.background};
        font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }
      .email-container {
        max-width: 600px;
        margin: 0 auto;
      }
      .button {
        display: inline-block;
        padding: 14px 32px;
        background: ${EMAIL_COLORS.primaryGradient};
        color: ${EMAIL_COLORS.white} !important;
        text-decoration: none;
        border-radius: 12px;
        font-weight: 600;
        font-size: 16px;
      }
      .button:hover {
        opacity: 0.9;
      }
      @media only screen and (max-width: 600px) {
        .email-container {
          width: 100% !important;
          padding: 16px !important;
        }
        .content-padding {
          padding: 24px !important;
        }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:${EMAIL_COLORS.background};font-family:'Geist',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    ${previewText ? `
    <!-- Preview text (hidden) -->
    <div style="display:none;font-size:1px;color:${EMAIL_COLORS.background};line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
      ${previewText}
    </div>
    ` : ''}

    <!-- Main container -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:${EMAIL_COLORS.background};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table class="email-container" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background-color:${EMAIL_COLORS.white};border-radius:24px;border:1px solid ${EMAIL_COLORS.border};overflow:hidden;">

            <!-- Header with logo -->
            <tr>
              <td align="center" style="padding:32px 32px 24px;background:${EMAIL_COLORS.primaryGradient};">
                <img src="${LOGO_URL}" alt="Symplepass" width="180" height="40" style="display:block;width:180px;height:auto;" />
              </td>
            </tr>

            <!-- Main content -->
            <tr>
              <td class="content-padding" style="padding:32px;">
                ${content}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:24px 32px;border-top:1px solid ${EMAIL_COLORS.border};background-color:${EMAIL_COLORS.background};">
                ${showFooterLinks ? `
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td align="center" style="padding-bottom:16px;">
                      <a href="${APP_URL}/eventos" style="color:${EMAIL_COLORS.primary};text-decoration:none;font-size:14px;margin:0 12px;">Eventos</a>
                      <a href="${APP_URL}/conta" style="color:${EMAIL_COLORS.primary};text-decoration:none;font-size:14px;margin:0 12px;">Minha Conta</a>
                      <a href="${APP_URL}/contato" style="color:${EMAIL_COLORS.primary};text-decoration:none;font-size:14px;margin:0 12px;">Suporte</a>
                    </td>
                  </tr>
                  <tr>
                    <td align="center">
                      <p style="margin:0;color:${EMAIL_COLORS.textLight};font-size:12px;">
                        © ${CURRENT_YEAR} Symplepass. Todos os direitos reservados.
                      </p>
                    </td>
                  </tr>
                </table>
                ` : `
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td align="center">
                      <p style="margin:0;color:${EMAIL_COLORS.textLight};font-size:12px;">
                        © ${CURRENT_YEAR} Symplepass. Todos os direitos reservados.
                      </p>
                    </td>
                  </tr>
                </table>
                `}
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`
}

/**
 * Helper to create a styled button
 */
export function createButton(text: string, href: string): string {
  return `
    <a href="${href}" class="button" style="display:inline-block;padding:14px 32px;background:${EMAIL_COLORS.primaryGradient};color:${EMAIL_COLORS.white};text-decoration:none;border-radius:12px;font-weight:600;font-size:16px;">
      ${text}
    </a>
  `
}

/**
 * Helper to create an info box
 */
export function createInfoBox(content: string, variant: 'default' | 'success' | 'warning' | 'error' = 'default'): string {
  const colors = {
    default: { bg: EMAIL_COLORS.background, border: EMAIL_COLORS.border, text: EMAIL_COLORS.text },
    success: { bg: EMAIL_COLORS.successBg, border: '#a7f3d0', text: '#065f46' },
    warning: { bg: EMAIL_COLORS.warningBg, border: '#fcd34d', text: '#92400e' },
    error: { bg: EMAIL_COLORS.errorBg, border: '#fecaca', text: '#991b1b' },
  }

  const { bg, border, text } = colors[variant]

  return `
    <div style="padding:20px;background-color:${bg};border:1px solid ${border};border-radius:16px;color:${text};">
      ${content}
    </div>
  `
}

/**
 * Helper to create a detail row
 */
export function createDetailRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid ${EMAIL_COLORS.border};">
        <p style="margin:0;color:${EMAIL_COLORS.textLight};font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">${label}</p>
        <p style="margin:4px 0 0;color:${EMAIL_COLORS.text};font-weight:600;">${value}</p>
      </td>
    </tr>
  `
}
