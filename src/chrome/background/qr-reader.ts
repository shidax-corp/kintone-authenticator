// Background Service Worker環境でのQRコード読み取り実装
// Offscreen Document APIを使用してDOM操作を行う
import { QRReadError } from '@lib/qr-reader';

let creatingOffscreen: Promise<void> | null = null;

async function ensureOffscreenDocument(): Promise<void> {
  // 既存のoffscreen documentをチェック
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
  });

  if (existingContexts.length > 0) {
    console.log('[QR Reader SW] Offscreen document already exists');
    return;
  }

  // 他のタスクがすでにoffscreen documentを作成中の場合は待機
  if (creatingOffscreen) {
    await creatingOffscreen;
    return;
  }

  // offscreen documentを作成
  creatingOffscreen = chrome.offscreen
    .createDocument({
      url: 'offscreen.html',
      reasons: ['DOM_PARSER'],
      justification: 'QRコードの読み取りのため画像処理が必要',
    })
    .finally(() => {
      creatingOffscreen = null;
    });

  await creatingOffscreen;
  console.log('[QR Reader SW] Offscreen document created');
}

export async function readQRFromImageInServiceWorker(
  imageUrl: string
): Promise<string> {
  console.log('[QR Reader SW] Reading QR from image URL:', imageUrl);
  console.log(
    '[QR Reader SW] URL protocol:',
    imageUrl.startsWith('http:')
      ? 'HTTP'
      : imageUrl.startsWith('https:')
        ? 'HTTPS'
        : imageUrl.startsWith('data:')
          ? 'DATA'
          : 'OTHER'
  );

  try {
    // Offscreen documentを確保
    await ensureOffscreenDocument();

    // Offscreen documentにメッセージを送信してQRコードを読み取る
    console.log('[QR Reader SW] Sending message to offscreen document...');
    const response = await chrome.runtime.sendMessage({
      type: 'READ_QR_FROM_IMAGE',
      data: {
        imageUrl: imageUrl,
      },
    });

    console.log('[QR Reader SW] Received response:', response);

    if (!response || !response.success) {
      throw new QRReadError(response?.error || '画像の読み込みに失敗しました');
    }

    console.log('[QR Reader SW] QR code successfully read:', response.data);
    return response.data;
  } catch (error) {
    console.error('[QR Reader SW] Error:', error);
    if (error instanceof QRReadError) {
      throw error;
    }
    throw new QRReadError('QRコードの読み取りに失敗しました');
  }
}
