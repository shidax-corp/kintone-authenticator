import type { KeychainStorage } from '@components/Keychain';

import { getSettings } from './storage';

// ビルド時にランダムな値が注入される
const PASSCODE_STORAGE_KEY =
  process.env.PASSCODE_STORAGE_KEY || 'kintone_authenticator_passcodes'; // フォールバック（テスト用）

const LAST_ACCESS_KEY =
  process.env.LAST_ACCESS_STORAGE_KEY ||
  'kintone_authenticator_passcode_last_access'; // フォールバック（テスト用）

/**
 * Chrome拡張機能用 chrome.storage.local実装
 * タイムアウト管理機能付き
 */
export class ChromeLocalStorage implements KeychainStorage {
  async getItem(key: string): Promise<string | null> {
    const result = await chrome.storage.local.get(key);

    // アクセスがあったので最終アクセス時刻を更新
    // 期限切れチェックは1分ごとのアラームで行うため、ここでは行わない
    // 最終アクセス時刻の更新は副作用なので、失敗しても無視する
    if (result[key]) {
      this.updateLastAccess().catch(() => {
        // 最終アクセス時刻の更新に失敗しても、データの取得には影響しない
      });
    }

    return result[key] || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
    // 最終アクセス時刻の更新は副作用なので、失敗しても無視する
    this.updateLastAccess().catch(() => {
      // 最終アクセス時刻の更新に失敗しても、データの保存には影響しない
    });
  }

  async removeItem(key: string): Promise<void> {
    await chrome.storage.local.remove(key);
  }

  /**
   * 最終アクセス時刻を更新
   */
  private async updateLastAccess(): Promise<void> {
    await chrome.storage.local.set({
      [LAST_ACCESS_KEY]: Date.now(),
    });
  }

  /**
   * タイムアウトをチェックし、期限切れなら削除
   *
   * @returns 期限切れで削除した場合はtrue、そうでない場合はfalse
   */
  async clearIfExpired(): Promise<boolean> {
    try {
      const settings = await getSettings();
      if (!settings) return false;

      const timeoutMs = settings.passcodeCacheTimeout * 60 * 1000;

      const result = await chrome.storage.local.get(LAST_ACCESS_KEY);
      const lastAccess = result[LAST_ACCESS_KEY];

      if (!lastAccess) return false;

      const isExpired = Date.now() - lastAccess > timeoutMs;

      if (isExpired) {
        await chrome.storage.local.remove([
          PASSCODE_STORAGE_KEY,
          LAST_ACCESS_KEY,
        ]);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }
}
