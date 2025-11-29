import type { EmailConfirmationData } from '@/types'

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

  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Inscrição confirmada</title>
    </head>
    <body style="background-color:#f8fafc;margin:0;padding:32px;font-family:'Geist',Arial,sans-serif;color:#0f172a;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px;background-color:#ffffff;border-radius:24px;border:1px solid #e2e8f0;padding:32px;">
              <tr>
                <td align="center" style="padding-bottom:24px;">
                  <div style="display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#0ea5e9,#22d3ee);color:#ffffff;padding:12px 24px;border-radius:999px;font-weight:600;font-size:18px;font-family:'Geist',Arial,sans-serif;">
                    Symplepass
                  </div>
                </td>
              </tr>
              <tr>
                <td style="text-align:center;">
                  <h1 style="font-size:28px;margin:0 0 8px;font-family:'Geist',Arial,sans-serif;">Inscrição confirmada!</h1>
                  <p style="margin:0 0 16px;color:#475569;">${safeName}, seu ingresso para <strong>${eventTitle}</strong> está garantido.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:24px;background:#f8fafc;border-radius:20px;margin-top:16px;">
                  <p style="margin:0 0 4px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Detalhes do evento</p>
                  <p style="margin:0;font-size:18px;font-weight:600;">${eventTitle}</p>
                  <p style="margin:4px 0;color:#475569;">${categoryName}</p>
                  <p style="margin:4px 0;color:#475569;">${eventDate}</p>
                  <p style="margin:4px 0;color:#475569;">${eventLocation}</p>
                </td>
              </tr>
              ${partnerData
      ? `
              <tr>
                <td style="padding:24px;background:#fff7ed;border-radius:20px;margin-top:16px;border:2px solid #fed7aa;">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                    <span style="font-size:20px;">👥</span>
                    <p style="margin:0;color:#ea580c;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">Dados do Parceiro(a)</p>
                  </div>
                  <table style="width:100%;border-collapse:collapse;">
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #fed7aa;">
                        <p style="margin:0;color:#9a3412;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Nome</p>
                        <p style="margin:0;color:#431407;font-weight:600;">${partnerData.name}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #fed7aa;">
                        <p style="margin:0;color:#9a3412;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Email</p>
                        <p style="margin:0;color:#431407;font-weight:600;">${partnerData.email}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #fed7aa;">
                        <p style="margin:0;color:#9a3412;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">CPF</p>
                        <p style="margin:0;color:#431407;font-weight:600;">${partnerData.cpf}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #fed7aa;">
                        <p style="margin:0;color:#9a3412;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Telefone</p>
                        <p style="margin:0;color:#431407;font-weight:600;">${partnerData.phone}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;">
                        <p style="margin:0;color:#9a3412;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Tamanho da camiseta</p>
                        <p style="margin:0;color:#431407;font-weight:600;">${partnerData.shirtSize}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              `
      : ''
    }
              <tr>
                <td style="padding-top:24px;text-align:center;">
                  <p style="margin:0 0 4px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Apresente no credenciamento</p>
                  <p style="margin:0 0 16px;font-size:18px;font-weight:600;">${ticketCode}</p>
                  ${qrCodeDataUrl
      ? `<img src="${qrCodeDataUrl}" alt="QR Code" style="width:200px;height:200px;border-radius:16px;border:1px solid #e2e8f0;background:#ffffff;padding:8px;" />`
      : `<div style="width:200px;height:200px;border-radius:16px;border:2px dashed #cbd5f5;display:flex;align-items:center;justify-content:center;color:#94a3b8;">QR Code indisponível</div>`
    }
                </td>
              </tr>
              <tr>
                <td style="padding-top:24px;">
                  ${qrMissingNote
      ? `<p style="margin:0 0 12px;color:#f97316;font-weight:600;">${qrMissingNote}</p>`
      : ''
    }
                  <p style="margin:0 0 8px;font-weight:600;">Próximos passos</p>
                  <ul style="padding-left:18px;margin:0;color:#475569;">
                    <li>Apresente este QR Code para retirar o kit atleta.</li>
                    <li>Chegue com 30 minutos de antecedência no dia do evento.</li>
                    <li>Leve um documento com foto para validação.</li>
                  </ul>
                </td>
              </tr>
              <tr>
                <td style="padding-top:32px;text-align:center;color:#94a3b8;font-size:12px;">
                  <p style="margin:0 0 4px;">Qualquer dúvida, fale com nosso suporte.</p>
                  <p style="margin:0;"><a href="https://symplepass.com/eventos" style="color:#0ea5e9;text-decoration:none;">Explorar eventos</a> • <a href="https://symplepass.com/suporte" style="color:#0ea5e9;text-decoration:none;">Suporte</a></p>
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
