import QRCode from 'qrcode';

/** Server-side QR as PNG data URL for TC verification links. */
export async function generateTcQrDataUrl(absoluteUrl: string): Promise<string> {
  return QRCode.toDataURL(absoluteUrl, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 220,
    color: {
      dark: '#0E2A47',
      light: '#FFFFFF',
    },
  });
}
