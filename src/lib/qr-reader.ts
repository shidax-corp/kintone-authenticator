import jsQR from 'jsqr';

export class QRReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QRReadError';
  }
}

export const readQRFromImage = async (imageUrl: string): Promise<string> => {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    return new Promise((resolve, reject) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new QRReadError('Failed to get canvas context'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          resolve(code.data);
        } else {
          reject(new QRReadError('No QR code found in the image'));
        }
      };

      img.onerror = () => {
        reject(new QRReadError('Failed to load image'));
      };

      img.src = imageUrl;
    });
  } catch (error) {
    throw new QRReadError(
      `QR reading failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

export const readQRFromCanvas = (canvas: HTMLCanvasElement): string | null => {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new QRReadError('Failed to get canvas context');
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height);

  return code ? code.data : null;
};

export const readQRFromElement = async (
  element: HTMLElement
): Promise<string> => {
  if (element instanceof HTMLImageElement) {
    return readQRFromImage(element.src);
  }

  if (element instanceof HTMLCanvasElement) {
    const result = readQRFromCanvas(element);
    if (result) {
      return result;
    }
    throw new QRReadError('No QR code found in canvas');
  }

  if (element instanceof SVGElement) {
    const svgData = new XMLSerializer().serializeToString(element);
    const svgBlob = new Blob([svgData], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const url = URL.createObjectURL(svgBlob);

    try {
      const result = await readQRFromImage(url);
      URL.revokeObjectURL(url);
      return result;
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    }
  }

  const backgroundImage = window.getComputedStyle(element).backgroundImage;
  if (backgroundImage && backgroundImage !== 'none') {
    const urlMatch = backgroundImage.match(/url\(["']?(.+?)["']?\)/);
    if (urlMatch && urlMatch[1]) {
      return readQRFromImage(urlMatch[1]);
    }
  }

  throw new QRReadError('Element type not supported for QR code reading');
};

export const isOTPAuthURI = (uri: string): boolean => {
  return uri.startsWith('otpauth://totp/') || uri.startsWith('otpauth://hotp/');
};
