import { 
  getSettings, 
  saveSettings, 
  isSettingsComplete, 
  getCachedRecords, 
  setCachedRecords, 
  clearCache,
  clearAllData 
} from './storage';
import type { ExtensionSettings, KintoneRecord } from './types';

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
        kintoneUsername: 'user',
        kintonePassword: 'pass',
        passphrase: 'secret',
        autoFillEnabled: true,
      };

      mockChrome.storage.sync.get.mockResolvedValue({
        kintone_authenticator_settings: mockSettings,
      });

      const result = await getSettings();
      expect(result).toEqual(mockSettings);
      expect(mockChrome.storage.sync.get).toHaveBeenCalledWith('kintone_authenticator_settings');
    });

    it('should return null when no settings exist', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({});

      const result = await getSettings();
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockChrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));

      const result = await getSettings();
      expect(result).toBeNull();
    });
  });

  describe('saveSettings', () => {
    it('should save settings to chrome storage', async () => {
      const settings: ExtensionSettings = {
        kintoneBaseUrl: 'https://example.cybozu.com',
        kintoneUsername: 'user',
        kintonePassword: 'pass',
        passphrase: 'secret',
        autoFillEnabled: true,
      };

      mockChrome.storage.sync.set.mockResolvedValue(undefined);

      await saveSettings(settings);
      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
        kintone_authenticator_settings: settings,
      });
    });

    it('should throw error on storage failure', async () => {
      const settings: ExtensionSettings = {
        kintoneBaseUrl: 'https://example.cybozu.com',
        kintoneUsername: 'user',
        kintonePassword: 'pass',
        passphrase: 'secret',
        autoFillEnabled: true,
      };

      mockChrome.storage.sync.set.mockRejectedValue(new Error('Storage error'));

      await expect(saveSettings(settings)).rejects.toThrow('Failed to save settings');
    });
  });

  describe('isSettingsComplete', () => {
    it('should return true for complete settings', () => {
      const settings: ExtensionSettings = {
        kintoneBaseUrl: 'https://example.cybozu.com',
        kintoneUsername: 'user',
        kintonePassword: 'pass',
        passphrase: 'secret',
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
        kintoneUsername: '',
        kintonePassword: 'pass',
        passphrase: 'secret',
        autoFillEnabled: true,
      } as ExtensionSettings;

      expect(isSettingsComplete(incompleteSettings)).toBe(false);
    });
  });

  describe('getCachedRecords', () => {
    it('should return cached records if not stale', async () => {
      const records: KintoneRecord[] = [
        {
          recordId: '1',
          name: 'Test Site',
          url: 'https://example.com',
          username: 'user',
          password: 'encrypted_pass',
          otpAuthUri: 'encrypted_uri',
          updatedTime: new Date().toISOString(),
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
      const records: KintoneRecord[] = [];
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
  });

  describe('setCachedRecords', () => {
    it('should cache records with timestamp', async () => {
      const records: KintoneRecord[] = [
        {
          recordId: '1',
          name: 'Test Site',
          url: 'https://example.com',
          username: 'user',
          password: 'encrypted_pass',
          otpAuthUri: 'encrypted_uri',
          updatedTime: new Date().toISOString(),
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
      expect(mockChrome.storage.local.remove).toHaveBeenCalledWith('kintone_authenticator_cache');
    });
  });

  describe('clearAllData', () => {
    it('should clear both sync and local storage', async () => {
      mockChrome.storage.sync.clear.mockResolvedValue(undefined);
      mockChrome.storage.local.clear.mockResolvedValue(undefined);

      await clearAllData();
      expect(mockChrome.storage.sync.clear).toHaveBeenCalled();
      expect(mockChrome.storage.local.clear).toHaveBeenCalled();
    });

    it('should throw error on failure', async () => {
      mockChrome.storage.sync.clear.mockRejectedValue(new Error('Clear error'));

      await expect(clearAllData()).rejects.toThrow('Failed to clear all data');
    });
  });
});