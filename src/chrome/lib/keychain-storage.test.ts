import { ChromeLocalStorage } from './keychain-storage';
import * as storage from './storage';

// chrome.storage.localのモック
const mockStorage: Record<string, unknown> = {};

const mockChromeStorageLocal = {
  get: jest.fn((keys: string | string[]) => {
    const result: Record<string, unknown> = {};
    const keyArray = typeof keys === 'string' ? [keys] : keys;

    keyArray.forEach((key) => {
      if (key in mockStorage) {
        result[key] = mockStorage[key];
      }
    });

    return Promise.resolve(result);
  }),
  set: jest.fn((items: Record<string, unknown>) => {
    Object.assign(mockStorage, items);
    return Promise.resolve();
  }),
  remove: jest.fn((keys: string | string[]) => {
    const keyArray = typeof keys === 'string' ? [keys] : keys;
    keyArray.forEach((key) => {
      delete mockStorage[key];
    });
    return Promise.resolve();
  }),
};

global.chrome = {
  storage: {
    local: mockChromeStorageLocal,
  },
} as unknown as typeof chrome;

// getSettingsのモック
jest.mock('./storage');
const mockGetSettings = storage.getSettings as jest.MockedFunction<
  typeof storage.getSettings
>;

describe('ChromeLocalStorage', () => {
  let chromeLocalStorage: ChromeLocalStorage;

  beforeEach(() => {
    // モックストレージをクリア
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    jest.clearAllMocks();

    chromeLocalStorage = new ChromeLocalStorage();

    // デフォルトの設定を返す
    mockGetSettings.mockResolvedValue({
      kintoneBaseUrl: 'https://example.cybozu.com',
      kintoneAppId: '123',
      kintoneUsername: 'user',
      kintonePassword: 'pass',
      autoFillEnabled: true,
      passcodeCacheTimeout: 5, // 5分
    });
  });

  describe('getItem / setItem / removeItem', () => {
    it('should set and get an item', async () => {
      await chromeLocalStorage.setItem('test-key', 'test-value');
      const value = await chromeLocalStorage.getItem('test-key');

      expect(value).toBe('test-value');
      expect(mockChromeStorageLocal.set).toHaveBeenCalledWith({
        'test-key': 'test-value',
      });
    });

    it('should return null for non-existent key', async () => {
      const value = await chromeLocalStorage.getItem('non-existent');

      expect(value).toBeNull();
    });

    it('should remove an item', async () => {
      await chromeLocalStorage.setItem('test-key', 'test-value');
      await chromeLocalStorage.removeItem('test-key');
      const value = await chromeLocalStorage.getItem('test-key');

      expect(value).toBeNull();
      expect(mockChromeStorageLocal.remove).toHaveBeenCalledWith('test-key');
    });
  });

  describe('updateLastAccess', () => {
    it('should update last access time when setting an item', async () => {
      const beforeTime = Date.now();
      await chromeLocalStorage.setItem('test-key', 'test-value');
      const afterTime = Date.now();

      const lastAccess =
        mockStorage['kintone_authenticator_passcode_last_access'];
      expect(lastAccess).toBeDefined();
      expect(typeof lastAccess).toBe('number');
      expect(lastAccess as number).toBeGreaterThanOrEqual(beforeTime);
      expect(lastAccess as number).toBeLessThanOrEqual(afterTime);
    });

    it('should update last access time when getting an item', async () => {
      await chromeLocalStorage.setItem('test-key', 'test-value');

      // 最終アクセス時刻を取得
      const firstAccess =
        mockStorage['kintone_authenticator_passcode_last_access'];

      // 少し待つ
      await new Promise((resolve) => setTimeout(resolve, 10));

      // 再度アクセス
      await chromeLocalStorage.getItem('test-key');

      const secondAccess =
        mockStorage['kintone_authenticator_passcode_last_access'];
      expect(secondAccess as number).toBeGreaterThan(firstAccess as number);
    });
  });

  describe('clearIfExpired', () => {
    it('should not clear data if not expired', async () => {
      await chromeLocalStorage.setItem('test-key', 'test-value');

      const cleared = await chromeLocalStorage.clearIfExpired();

      expect(cleared).toBe(false);
      expect(await chromeLocalStorage.getItem('test-key')).toBe('test-value');
    });

    it('should clear data if expired', async () => {
      // タイムアウトを1分に設定
      mockGetSettings.mockResolvedValue({
        kintoneBaseUrl: 'https://example.cybozu.com',
        kintoneAppId: '123',
        kintoneUsername: 'user',
        kintonePassword: 'pass',
        autoFillEnabled: true,
        passcodeCacheTimeout: 1, // 1分
      });

      // パスコードストレージのキーを使用
      await chromeLocalStorage.setItem(
        'kintone_authenticator_passcodes',
        'test-passcodes'
      );

      // 最終アクセス時刻を2分前に変更
      const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
      mockStorage['kintone_authenticator_passcode_last_access'] = twoMinutesAgo;

      const cleared = await chromeLocalStorage.clearIfExpired();

      expect(cleared).toBe(true);
      expect(mockStorage['kintone_authenticator_passcodes']).toBeUndefined();
      expect(
        mockStorage['kintone_authenticator_passcode_last_access']
      ).toBeUndefined();
    });

    it('should return false if no last access time is set', async () => {
      const cleared = await chromeLocalStorage.clearIfExpired();

      expect(cleared).toBe(false);
    });

    it('should return false if settings are not available', async () => {
      mockGetSettings.mockResolvedValue(null);

      await chromeLocalStorage.setItem('test-key', 'test-value');
      const cleared = await chromeLocalStorage.clearIfExpired();

      expect(cleared).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockGetSettings.mockRejectedValue(new Error('Settings error'));

      const cleared = await chromeLocalStorage.clearIfExpired();

      expect(cleared).toBe(false);
    });
  });

  describe('integration with getItem', () => {
    it('should auto-clear expired data on getItem', async () => {
      // タイムアウトを1分に設定
      mockGetSettings.mockResolvedValue({
        kintoneBaseUrl: 'https://example.cybozu.com',
        kintoneAppId: '123',
        kintoneUsername: 'user',
        kintonePassword: 'pass',
        autoFillEnabled: true,
        passcodeCacheTimeout: 1, // 1分
      });

      await chromeLocalStorage.setItem(
        'kintone_authenticator_passcodes',
        'test-passcodes'
      );

      // 最終アクセス時刻を2分前に変更
      const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
      mockStorage['kintone_authenticator_passcode_last_access'] = twoMinutesAgo;

      // getItemを呼ぶと自動的にクリアされる
      const value = await chromeLocalStorage.getItem(
        'kintone_authenticator_passcodes'
      );

      expect(value).toBeNull();
      expect(mockStorage['kintone_authenticator_passcodes']).toBeUndefined();
    });
  });
});
