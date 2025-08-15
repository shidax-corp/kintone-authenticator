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

export const readQRFromFile = async (file: File): Promise<string> => {
  if (!file.type.startsWith('image/')) {
    throw new QRReadError('File must be an image');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const dataUrl = e.target?.result;
        if (typeof dataUrl !== 'string') {
          reject(new QRReadError('Failed to read file'));
          return;
        }

        const result = await readQRFromImage(dataUrl);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new QRReadError('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

export const readQRFromClipboard = async (): Promise<string> => {
  try {
    const items = await navigator.clipboard.read();

    for (const item of items) {
      const imageTypes = item.types.filter((type) => type.startsWith('image/'));

      if (imageTypes.length === 0) {
        continue;
      }

      for (const imageType of imageTypes) {
        try {
          const blob = await item.getType(imageType);

          return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
              try {
                const dataUrl = e.target?.result;
                if (typeof dataUrl !== 'string') {
                  reject(new QRReadError('読み込めませんでした'));
                  return;
                }

                const result = await readQRFromImage(dataUrl);
                resolve(result);
              } catch (error) {
                reject(error);
              }
            };

            reader.onerror = () => {
              reject(new QRReadError('読み込めませんでした'));
            };

            reader.readAsDataURL(blob);
          });
        } catch (error) {
          continue;
        }
      }
    }

    throw new QRReadError('画像がコピーされていません');
  } catch (error) {
    if (error instanceof QRReadError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      throw new QRReadError('クリップボードへのアクセスが許可されていません');
    }

    throw new QRReadError(
      `Failed to read from clipboard: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};
