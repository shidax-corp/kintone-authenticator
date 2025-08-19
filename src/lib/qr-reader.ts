import jsQR from 'jsqr';

export class QRReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QRReadError';
  }
}

export const readQRFromImage = async (imageUrl: string): Promise<string> => {
  // DOM環境での実行（Content Script、Popup、Optionsページなど）
  console.log('[QR Reader] Reading QR from image URL:', imageUrl);

  const img = new Image();
  img.crossOrigin = 'anonymous';
  let objectUrl: string | null = null;

  return new Promise((resolve, reject) => {
    img.onload = () => {
      console.log(
        '[QR Reader] Image loaded, dimensions:',
        img.width,
        'x',
        img.height
      );

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        reject(new QRReadError('読み取りに失敗しました'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      // Clean up object URL if it was created
      if (objectUrl) URL.revokeObjectURL(objectUrl);

      if (code) {
        console.log('[QR Reader] QR code found:', code.data);
        resolve(code.data);
      } else {
        console.error('[QR Reader] No QR code found in image');
        reject(new QRReadError('画像内にQRコードが見つかりませんでした'));
      }
    };

    img.onerror = (e) => {
      console.error('[QR Reader] Image load error:', e);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new QRReadError('画像の読み込みに失敗しました'));
    };

    // data URLの場合はそのまま使用、それ以外はfetchで取得
    if (imageUrl.startsWith('data:')) {
      img.src = imageUrl;
    } else {
      // HTTPやHTTPSのURLの場合はfetch経由で取得
      fetch(imageUrl)
        .then((response) => {
          if (!response.ok) {
            throw new QRReadError(
              `画像の取得に失敗しました (HTTP ${response.status})`
            );
          }
          return response.blob();
        })
        .then((blob) => {
          objectUrl = URL.createObjectURL(blob);
          img.src = objectUrl;
        })
        .catch((error) => {
          reject(
            error instanceof QRReadError
              ? error
              : new QRReadError(String(error))
          );
        });
    }
  });
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
