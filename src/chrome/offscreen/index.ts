import jsQR from 'jsqr';

interface QRReadRequest {
  type: 'READ_QR_FROM_IMAGE';
  imageUrl: string;
}

interface QRReadResponse {
  success: boolean;
  data?: string;
  error?: string;
}

// Service Workerからのメッセージを受信
chrome.runtime.onMessage.addListener(
  (
    request: QRReadRequest,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: QRReadResponse) => void
  ) => {
    if (request.type === 'READ_QR_FROM_IMAGE') {
      readQRFromImage(request.imageUrl)
        .then((data) => {
          sendResponse({ success: true, data });
        })
        .catch((error) => {
          console.error('[Offscreen] QR read error:', error);
          sendResponse({
            success: false,
            error: error.message || '画像の読み込みに失敗しました',
          });
        });
      return true; // Keep message channel open for async response
    }
  }
);

async function readQRFromImage(imageUrl: string): Promise<string> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  let objectUrl: string | null = null;

  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        reject(new Error('読み取りに失敗しました'));
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
        resolve(code.data);
      } else {
        console.error('[Offscreen] No QR code found in image');
        reject(new Error('画像内にQRコードが見つかりませんでした'));
      }
    };

    img.onerror = (e) => {
      console.error('[Offscreen] Image load error:', e);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('画像の読み込みに失敗しました'));
    };

    // data URLの場合はそのまま使用、それ以外はfetchで取得
    if (imageUrl.startsWith('data:')) {
      img.src = imageUrl;
    } else {
      // HTTPやHTTPSのURLの場合はfetch経由で取得
      fetch(imageUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error(
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
          reject(error instanceof Error ? error : new Error(String(error)));
        });
    }
  });
}
