import { generateTOTP } from '@lib/gen-otp';
import { decodeOTPAuthURI, isValidOTPAuthURI } from '@lib/otpauth-uri';

import { getSettings, isSettingsComplete } from '../lib/storage';
import type {
  ExtensionSettings,
  GetOTPMessage,
  GetRecordsMessage,
  Message,
  RegisterOTPMessage,
} from '../lib/types';
import { KintoneClient } from './kintone-client';
import { readQRFromImageInServiceWorker } from './qr-reader';

let contextMenusCreated = false;

const createContextMenus = async () => {
  if (contextMenusCreated) return;

  const settings = await getSettings();
  if (!isSettingsComplete(settings)) return;

  try {
    await chrome.contextMenus.removeAll();

    chrome.contextMenus.create({
      id: 'read_qr',
      title: 'ワンタイムパスワードを登録する',
      contexts: ['image'],
    });

    chrome.contextMenus.create({
      id: 'fill_from_kintone',
      title: 'kintoneから入力する',
      contexts: ['editable'],
    });

    contextMenusCreated = true;
  } catch {
    // Context menu creation failures are not critical
  }
};

const removeContextMenus = async () => {
  try {
    await chrome.contextMenus.removeAll();
    contextMenusCreated = false;
  } catch {
    // Context menu creation failures are not critical
  }
};

chrome.runtime.onInstalled.addListener(async (details) => {
  // インストールまたはアップデート時に設定をチェック
  if (details.reason === 'install' || details.reason === 'update') {
    const settings = await getSettings();
    if (!isSettingsComplete(settings)) {
      chrome.runtime.openOptionsPage();
    }
  }

  await createContextMenus();
});

chrome.runtime.onStartup.addListener(async () => {
  await createContextMenus();
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === 'local' && changes.kintone_authenticator_settings) {
    const settings = changes.kintone_authenticator_settings.newValue;
    if (isSettingsComplete(settings)) {
      await createContextMenus();
    } else {
      await removeContextMenus();
    }
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  const settings = await getSettings();
  if (!isSettingsComplete(settings)) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'SHOW_ERROR',
      data: {
        message:
          '設定が完了していません。拡張機能の設定ページを開いてください。',
      },
    });
    return;
  }

  try {
    const client = new KintoneClient(settings);

    switch (info.menuItemId) {
      case 'read_qr':
        if (info.srcUrl) {
          await handleReadQR(tab.id, info.srcUrl);
        }
        break;

      case 'fill_from_kintone':
        await handleFillFromKintone(tab.id, tab.url || '', client);
        break;
    }
  } catch {
    chrome.tabs.sendMessage(tab.id, {
      type: 'SHOW_ERROR',
      data: {
        message: 'エラーが発生しました',
      },
    });
  }
});

const handleReadQR = async (tabId: number, imageUrl: string) => {
  try {
    // activeTab権限を使用してbackground scriptで画像を取得
    // これにより、*.cybozu.com以外のドメインでも動作する
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`画像の取得に失敗しました: ${imageUrl} (HTTP ${response.status})`);
    }

    const blob = await response.blob();

    // BlobをData URLに変換してoffscreen documentに渡す
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Data URLの生成に失敗しました'));
        }
      };
      reader.onerror = () => reject(new Error('Data URLの生成に失敗しました'));
      reader.readAsDataURL(blob);
    });

    const qrData = await readQRFromImageInServiceWorker(dataUrl);

    if (await isValidOTPAuthURI(qrData)) {
      chrome.tabs.sendMessage(tabId, {
        type: 'OPEN_REGISTER_FORM',
        data: { otpAuthUri: qrData },
      });
    } else {
      chrome.tabs.sendMessage(tabId, {
        type: 'SHOW_ERROR',
        data: { message: 'QRコードからOTPAuth URIを読み取れませんでした。' },
      });
    }
  } catch {
    chrome.tabs.sendMessage(tabId, {
      type: 'SHOW_ERROR',
      data: { message: 'QRコードの読み取りに失敗しました。' },
    });
  }
};

const handleFillFromKintone = async (
  tabId: number,
  url: string,
  client: KintoneClient
) => {
  try {
    const records = await client.getRecords();

    chrome.tabs.sendMessage(tabId, {
      type: 'SHOW_FILL_OPTIONS',
      data: {
        records: records,
        currentUrl: url,
      },
    });
  } catch {
    chrome.tabs.sendMessage(tabId, {
      type: 'SHOW_ERROR',
      data: { message: 'kintoneからの情報取得に失敗しました。' },
    });
  }
};

const generateOTPFromRecord = async (record: kintone.types.SavedFields) => {
  const otpAuthRecord = decodeOTPAuthURI(record.otpuri.value);

  if (otpAuthRecord.type === 'TOTP') {
    return await generateTOTP({
      secret: otpAuthRecord.secret,
      algorithm: otpAuthRecord.algorithm,
      digits: otpAuthRecord.digits,
      period: otpAuthRecord.period,
    });
  }

  throw new Error('HOTP is not supported yet');
};

chrome.runtime.onMessage.addListener(
  (message: Message, sender, sendResponse) => {
    (async () => {
      try {
        const getClient = async () => {
          const settings = await getSettings();
          if (!isSettingsComplete(settings)) {
            throw new Error('Settings not complete');
          }
          return new KintoneClient(settings);
        };

        switch (message.type) {
          case 'REGISTER_OTP': {
            const client = await getClient();
            const recordData = (message as RegisterOTPMessage).data;
            const recordId = await client.createRecord(recordData);
            sendResponse({ success: true, data: { recordId } });
            break;
          }

          case 'GET_RECORDS': {
            const client = await getClient();
            const { forceRefresh } = (message as GetRecordsMessage).data || {};
            const records = await client.getRecords(!forceRefresh);
            sendResponse({ success: true, data: records });
            break;
          }

          case 'GET_OTP': {
            const client = await getClient();
            const { recordId } = (message as GetOTPMessage).data;
            const records = await client.getRecords();
            const record = records.find((r) => r.$id.value === recordId);

            if (!record || !record.otpuri?.value) {
              throw new Error('Record not found or no OTP configured');
            }

            const otp = await generateOTPFromRecord(record);
            sendResponse({ success: true, data: otp });
            break;
          }

          case 'GET_SETTINGS': {
            const settings = await getSettings();
            sendResponse({ success: true, data: settings });
            break;
          }

          case 'TEST_CONNECTION': {
            const testSettings = message.data as ExtensionSettings;
            const testClient = new KintoneClient(testSettings);
            const isConnected = await testClient.testConnection();
            sendResponse({ success: isConnected });
            break;
          }

          default:
            sendResponse({ error: 'Unknown message type' });
        }
      } catch (error) {
        sendResponse({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    })();

    return true; // Keep message channel open for async response
  }
);
