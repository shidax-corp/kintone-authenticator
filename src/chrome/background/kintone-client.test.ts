import { KintoneRestAPIClient } from '@kintone/rest-api-client';

import { getCachedRecords, setCachedRecords } from '../lib/storage';
import type { ExtensionSettings } from '../lib/types';
import { KintoneClient, KintoneClientError } from './kintone-client';

jest.mock('@kintone/rest-api-client');
jest.mock('../lib/storage');

const mockKintoneClient = {
  record: {
    getRecords: jest.fn(),
    addRecord: jest.fn(),
    updateRecord: jest.fn(),
    deleteRecords: jest.fn(),
  },
  app: {
    getApp: jest.fn(),
  },
};

const mockGetCachedRecords = getCachedRecords as jest.MockedFunction<
  typeof getCachedRecords
>;
const mockSetCachedRecords = setCachedRecords as jest.MockedFunction<
  typeof setCachedRecords
>;

(KintoneRestAPIClient as any).mockImplementation(() => mockKintoneClient);

describe('KintoneClient', () => {
  const mockSettings: ExtensionSettings = {
    kintoneBaseUrl: 'https://example.cybozu.com',
    kintoneUsername: 'user',
    kintonePassword: 'pass',
    autoFillEnabled: true,
  };

  const appId = '123';
  let client: KintoneClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new KintoneClient(mockSettings, appId);
  });

  describe('constructor', () => {
    it('should create KintoneRestAPIClient with correct settings', () => {
      expect(KintoneRestAPIClient).toHaveBeenCalledWith({
        baseUrl: mockSettings.kintoneBaseUrl,
        auth: {
          username: mockSettings.kintoneUsername,
          password: mockSettings.kintonePassword,
        },
      });
    });
  });

  describe('getRecords', () => {
    const mockKintoneRecords = [
      {
        $id: { value: '1' },
        name: { value: 'Test Site' },
        url: { value: 'https://example.com' },
        username: { value: 'user1' },
        password: { value: 'password123' },
        otpuri: {
          value:
            'otpauth://totp/Example:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example',
        },
        更新日時: { value: '2023-01-01T00:00:00Z' },
      },
    ];

    it('should return cached records when available and useCache is true', async () => {
      const cachedRecords: kintone.types.SavedFields[] = [
        {
          $id: { value: '1' },
          $revision: { value: '1' },
          更新者: { value: { code: 'user', name: 'User' } },
          作成者: { value: { code: 'user', name: 'User' } },
          レコード番号: { value: '1' },
          更新日時: { value: '2023-01-01T00:00:00Z' },
          作成日時: { value: '2023-01-01T00:00:00Z' },
          name: { value: 'Cached Site' },
          url: { value: 'https://cached.com' },
          username: { value: 'cached_user' },
          password: { value: 'cached_pass' },
          otpuri: { value: 'cached_uri' },
          shareto: { value: [] },
        },
      ];

      mockGetCachedRecords.mockResolvedValue(cachedRecords);

      const result = await client.getRecords(true);
      expect(result).toEqual(cachedRecords);
      expect(mockKintoneClient.record.getRecords).not.toHaveBeenCalled();
    });

    it('should fetch fresh records when cache is empty or useCache is false', async () => {
      mockGetCachedRecords.mockResolvedValue(null);
      mockKintoneClient.record.getRecords.mockResolvedValue({
        records: mockKintoneRecords,
      });

      await client.getRecords(true);

      expect(mockKintoneClient.record.getRecords).toHaveBeenCalledWith({
        app: appId,
        fields: [
          '$id',
          'name',
          'url',
          'username',
          'password',
          'otpuri',
          '更新日時',
        ],
      });
      expect(mockSetCachedRecords).toHaveBeenCalled();
    });

    it('should fallback to cache on fetch failure', async () => {
      const cachedRecords: kintone.types.SavedFields[] = [
        {
          $id: { value: '1' },
          $revision: { value: '1' },
          更新者: { value: { code: 'user', name: 'User' } },
          作成者: { value: { code: 'user', name: 'User' } },
          レコード番号: { value: '1' },
          更新日時: { value: '2023-01-01T00:00:00Z' },
          作成日時: { value: '2023-01-01T00:00:00Z' },
          name: { value: 'Cached Site' },
          url: { value: 'https://cached.com' },
          username: { value: 'cached_user' },
          password: { value: 'cached_pass' },
          otpuri: { value: 'cached_uri' },
          shareto: { value: [] },
        },
      ];

      mockGetCachedRecords
        .mockResolvedValueOnce(null) // First call returns null
        .mockResolvedValueOnce(cachedRecords); // Second call returns cache

      mockKintoneClient.record.getRecords.mockRejectedValue(
        new Error('Network error')
      );

      const result = await client.getRecords(true);
      expect(result).toEqual(cachedRecords);
    });

    it('should throw error when fetch fails and no cache available', async () => {
      mockGetCachedRecords.mockResolvedValue(null);
      mockKintoneClient.record.getRecords.mockRejectedValue(
        new Error('Network error')
      );

      await expect(client.getRecords(true)).rejects.toThrow(KintoneClientError);
    });
  });

  describe('createRecord', () => {
    it('should create record with sensitive data', async () => {
      const recordData = {
        name: 'New Site',
        url: 'https://new.com',
        username: 'newuser',
        password: 'newpass',
        otpAuthUri: 'otpauth://totp/test',
      };

      mockKintoneClient.record.addRecord.mockResolvedValue({ id: '123' });
      mockKintoneClient.record.getRecords.mockResolvedValue({ records: [] });

      const result = await client.createRecord(recordData);

      expect(mockKintoneClient.record.addRecord).toHaveBeenCalledWith({
        app: appId,
        record: {
          name: { value: 'New Site' },
          url: { value: 'https://new.com' },
          username: { value: 'newuser' },
          password: { value: 'newpass' },
          otpuri: { value: 'otpauth://totp/test' },
          shareto: { value: [{ code: 'user' }] },
        },
      });
      expect(result).toBe('123');
    });

    it('should throw error on creation failure', async () => {
      const recordData = {
        name: 'New Site',
        url: 'https://new.com',
        username: 'newuser',
        password: 'newpass',
      };

      mockKintoneClient.record.addRecord.mockRejectedValue(
        new Error('Create failed')
      );

      await expect(client.createRecord(recordData)).rejects.toThrow(
        KintoneClientError
      );
    });
  });

  describe('updateRecord', () => {
    it('should update record with encrypted sensitive data', async () => {
      const updateData = {
        name: 'Updated Site',
        password: 'newpass',
      };

      mockKintoneClient.record.getRecords.mockResolvedValue({ records: [] });

      await client.updateRecord('123', updateData);

      expect(mockKintoneClient.record.updateRecord).toHaveBeenCalledWith({
        app: appId,
        id: '123',
        record: {
          name: { value: 'Updated Site' },
          password: { value: 'newpass' },
        },
      });
    });

    it('should throw error on update failure', async () => {
      mockKintoneClient.record.updateRecord.mockRejectedValue(
        new Error('Update failed')
      );

      await expect(
        client.updateRecord('123', { name: 'Updated' })
      ).rejects.toThrow(KintoneClientError);
    });
  });

  describe('deleteRecord', () => {
    it('should delete record and refresh cache', async () => {
      mockKintoneClient.record.getRecords.mockResolvedValue({ records: [] });

      await client.deleteRecord('123');

      expect(mockKintoneClient.record.deleteRecords).toHaveBeenCalledWith({
        app: appId,
        ids: ['123'],
      });
      expect(mockKintoneClient.record.getRecords).toHaveBeenCalled();
    });

    it('should throw error on deletion failure', async () => {
      mockKintoneClient.record.deleteRecords.mockRejectedValue(
        new Error('Delete failed')
      );

      await expect(client.deleteRecord('123')).rejects.toThrow(
        KintoneClientError
      );
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection', async () => {
      mockKintoneClient.app.getApp.mockResolvedValue({});

      const result = await client.testConnection();
      expect(result).toBe(true);
    });

    it('should return false for failed connection', async () => {
      mockKintoneClient.app.getApp.mockRejectedValue(
        new Error('Connection failed')
      );

      const result = await client.testConnection();
      expect(result).toBe(false);
    });
  });
});
