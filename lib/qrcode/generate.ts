import QRCode from 'qrcode'

export async function generateQRCode(payload: string): Promise<string | null> {
  if (!payload) {
    return null
  }

  try {
    const dataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    return dataUrl
  } catch (error) {
    console.error('Failed to generate QR code:', error)
    return null
  }
}
