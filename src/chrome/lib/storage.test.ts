import {
  clearAllData,
  clearCache,
  getCachedRecords,
  getSettings,
  isSettingsComplete,
  saveSettings,
  setCachedRecords,
} from './storage';
import type { ExtensionSettings } from './types';

const mockChrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
    },
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
  },
};

global.chrome = mockChrome as any;

describe('storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return settings from chrome storage', async () => {
      const mockSettings: ExtensionSettings = {
        kintoneBaseUrl: 'https://example.cybozu.com',
        kintoneAppId: '123',
        kintoneUsername: 'user',
        kintonePassword: 'pass',
        autoFillEnabled: true,
      };

      mockChrome.storage.local.get.mockResolvedValue({
        kintone_authenticator_settings: mockSettings,
      });

      const result = await getSettings();
      expect(result).toEqual(mockSettings);
      expect(mockChrome.storage.local.get).toHaveBeenCalledWith(
        'kintone_authenticator_settings'
      );
    });

    it('should return null when no settings exist', async () => {
      mockChrome.storage.local.get.mockResolvedValue({});

      const result = await getSettings();
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockChrome.storage.local.get.mockRejectedValue(
        new Error('Storage error')
      );

      const result = await getSettings();
      expect(result).toBeNull();
    });
  });

  describe('saveSettings', () => {
    it('should save settings to chrome storage', async () => {
      const settings: ExtensionSettings = {
        kintoneBaseUrl: 'https://example.cybozu.com',
        kintoneAppId: '123',
        kintoneUsername: 'user',
        kintonePassword: 'pass',
        autoFillEnabled: true,
      };

      mockChrome.storage.local.set.mockResolvedValue(undefined);

      await saveSettings(settings);
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        kintone_authenticator_settings: settings,
      });
    });

    it('should throw error on storage failure', async () => {
      const settings: ExtensionSettings = {
        kintoneBaseUrl: 'https://example.cybozu.com',
        kintoneAppId: '123',
        kintoneUsername: 'user',
        kintonePassword: 'pass',
        autoFillEnabled: true,
      };

      mockChrome.storage.local.set.mockRejectedValue(
        new Error('Storage error')
      );

      await expect(saveSettings(settings)).rejects.toThrow(
        'Failed to save settings'
      );
    });
  });

  describe('isSettingsComplete', () => {
    it('should return true for complete settings', () => {
      const settings: ExtensionSettings = {
        kintoneBaseUrl: 'https://example.cybozu.com',
        kintoneAppId: '123',
        kintoneUsername: 'user',
        kintonePassword: 'pass',
        autoFillEnabled: true,
      };

      expect(isSettingsComplete(settings)).toBe(true);
    });

    it('should return false for null settings', () => {
      expect(isSettingsComplete(null)).toBe(false);
    });

    it('should return false for incomplete settings', () => {
      const incompleteSettings = {
        kintoneBaseUrl: 'https://example.cybozu.com',
        kintoneAppId: '123',
        kintoneUsername: '',
        kintonePassword: 'pass',
        autoFillEnabled: true,
      } as ExtensionSettings;

      expect(isSettingsComplete(incompleteSettings)).toBe(false);
    });

    it('should return false for settings with invalid app URL', () => {
      const incompleteSettings = {
        kintoneBaseUrl: '',
        kintoneAppId: '',
        kintoneUsername: 'user',
        kintonePassword: 'pass',
        autoFillEnabled: true,
      } as ExtensionSettings;

      expect(isSettingsComplete(incompleteSettings)).toBe(false);
    });
  });

  describe('getCachedRecords', () => {
    it('should return cached records if not stale', async () => {
      const records: kintone.types.SavedFields[] = [
        {
          $id: { value: '1' },
          $revision: { value: '1' },
          更新者: { value: { code: 'user', name: 'User' } },
          作成者: { value: { code: 'user', name: 'User' } },
          レコード番号: { value: '1' },
          更新日時: { value: new Date().toISOString() },
          作成日時: { value: new Date().toISOString() },
          name: { value: 'Test Site' },
          url: { value: 'https://example.com' },
          username: { value: 'user' },
          password: { value: 'password123' },
          otpuri: { value: 'encrypted_uri' },
          shareto: { value: [] },
        },
      ];

      const cache = {
        data: records,
        timestamp: Date.now() - 60000, // 1 minute ago
      };

      mockChrome.storage.local.get.mockResolvedValue({
        kintone_authenticator_cache: cache,
      });

      const result = await getCachedRecords();
      expect(result).toEqual(records);
    });

    it('should return null for stale cache', async () => {
      const records: kintone.types.SavedFields[] = [];
      const cache = {
        data: records,
        timestamp: Date.now() - 6 * 60 * 1000, // 6 minutes ago (stale)
      };

      mockChrome.storage.local.get.mockResolvedValue({
        kintone_authenticator_cache: cache,
      });

      const result = await getCachedRecords();
      expect(result).toBeNull();
    });

    it('should return null when no cache exists', async () => {
      mockChrome.storage.local.get.mockResolvedValue({});

      const result = await getCachedRecords();
      expect(result).toBeNull();
    });

    it('should return null when timestamp is undefined', async () => {
      const cache = {
        data: [],
        timestamp: undefined,
      };

      mockChrome.storage.local.get.mockResolvedValue({
        kintone_authenticator_cache: cache,
      });

      const result = await getCachedRecords();
      expect(result).toBeNull();
    });

    it('should return null when timestamp is a string', async () => {
      const cache = {
        data: [],
        timestamp: '1234567890',
      };

      mockChrome.storage.local.get.mockResolvedValue({
        kintone_authenticator_cache: cache,
      });

      const result = await getCachedRecords();
      expect(result).toBeNull();
    });

    it('should return null when timestamp is null', async () => {
      const cache = {
        data: [],
        timestamp: null,
      };

      mockChrome.storage.local.get.mockResolvedValue({
        kintone_authenticator_cache: cache,
      });

      const result = await getCachedRecords();
      expect(result).toBeNull();
    });

    it('should return null when timestamp is NaN', async () => {
      const cache = {
        data: [],
        timestamp: NaN,
      };

      mockChrome.storage.local.get.mockResolvedValue({
        kintone_authenticator_cache: cache,
      });

      const result = await getCachedRecords();
      expect(result).toBeNull();
    });

    it('should return null when timestamp is Infinity', async () => {
      const cache = {
        data: [],
        timestamp: Infinity,
      };

      mockChrome.storage.local.get.mockResolvedValue({
        kintone_authenticator_cache: cache,
      });

      const result = await getCachedRecords();
      expect(result).toBeNull();
    });

    it('should return null when data property is missing', async () => {
      const cache = {
        timestamp: Date.now(),
      };

      mockChrome.storage.local.get.mockResolvedValue({
        kintone_authenticator_cache: cache,
      });

      const result = await getCachedRecords();
      expect(result).toBeNull();
    });

    it('should return null when data is not an array', async () => {
      const cache = {
        data: 'not an array',
        timestamp: Date.now(),
      };

      mockChrome.storage.local.get.mockResolvedValue({
        kintone_authenticator_cache: cache,
      });

      const result = await getCachedRecords();
      expect(result).toBeNull();
    });

    it('should return null when cache is a primitive value', async () => {
      mockChrome.storage.local.get.mockResolvedValue({
        kintone_authenticator_cache: 'invalid',
      });

      const result = await getCachedRecords();
      expect(result).toBeNull();
    });

    it('should return null when cache is a number', async () => {
      mockChrome.storage.local.get.mockResolvedValue({
        kintone_authenticator_cache: 123,
      });

      const result = await getCachedRecords();
      expect(result).toBeNull();
    });
  });

  describe('setCachedRecords', () => {
    it('should cache records with timestamp', async () => {
      const records: kintone.types.SavedFields[] = [
        {
          $id: { value: '1' },
          $revision: { value: '1' },
          更新者: { value: { code: 'user', name: 'User' } },
          作成者: { value: { code: 'user', name: 'User' } },
          レコード番号: { value: '1' },
          更新日時: { value: new Date().toISOString() },
          作成日時: { value: new Date().toISOString() },
          name: { value: 'Test Site' },
          url: { value: 'https://example.com' },
          username: { value: 'user' },
          password: { value: 'password123' },
          otpuri: { value: 'encrypted_uri' },
          shareto: { value: [] },
        },
      ];

      mockChrome.storage.local.set.mockResolvedValue(undefined);

      await setCachedRecords(records);

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        kintone_authenticator_cache: {
          data: records,
          timestamp: expect.any(Number),
        },
      });
    });
  });

  describe('clearCache', () => {
    it('should remove cache from storage', async () => {
      mockChrome.storage.local.remove.mockResolvedValue(undefined);

      await clearCache();
      expect(mockChrome.storage.local.remove).toHaveBeenCalledWith(
        'kintone_authenticator_cache'
      );
    });
  });

  describe('clearAllData', () => {
    it('should clear both sync and local storage', async () => {
      mockChrome.storage.local.clear.mockResolvedValue(undefined);

      await clearAllData();
      expect(mockChrome.storage.local.clear).toHaveBeenCalled();
    });

    it('should throw error on failure', async () => {
      mockChrome.storage.local.clear.mockRejectedValue(
        new Error('Clear error')
      );

      await expect(clearAllData()).rejects.toThrow('Failed to clear all data');
    });
  });
});
