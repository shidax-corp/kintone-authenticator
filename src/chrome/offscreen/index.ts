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

  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('読み取りに失敗しました'));
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
        console.error('[Offscreen] No QR code found in image');
        reject(new Error('画像内にQRコードが見つかりませんでした'));
      }
    };

    img.onerror = (e) => {
      console.error('[Offscreen] Image load error:', e);
      reject(new Error('画像の読み込みに失敗しました'));
    };

    // Data URLをそのまま使用
    // fetchはbackground scriptで既に実行済み
    img.src = imageUrl;
  });
}
