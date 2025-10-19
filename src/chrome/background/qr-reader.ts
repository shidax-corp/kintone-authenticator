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
}

export async function readQRFromImageInServiceWorker(
  dataUrl: string
): Promise<string> {
  try {
    // Offscreen documentを確保
    await ensureOffscreenDocument();

    // Offscreen documentにメッセージを送信してQRコードを読み取る
    // dataUrlはbackground scriptでfetchして変換されたData URL
    const response = await chrome.runtime.sendMessage({
      type: 'READ_QR_FROM_IMAGE',
      imageUrl: dataUrl,
    });

    if (!response || !response.success) {
      throw new QRReadError(response?.error || '画像の読み込みに失敗しました');
    }

    return response.data;
  } catch (error) {
    console.error('[QR Reader SW] Error:', error);
    if (error instanceof QRReadError) {
      throw error;
    }
    throw new QRReadError('QRコードの読み取りに失敗しました');
  }
}
