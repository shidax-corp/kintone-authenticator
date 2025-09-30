import '@testing-library/jest-dom';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useSearch } from './search';

// Mock kintone API
const mockKintoneApi = jest.fn();
global.kintone = {
  api: mockKintoneApi,
} as any;

describe('useSearch (kintone integration)', () => {
  const mockAppId = 1;
  const mockRecords: kintone.types.SavedFields[] = [
    {
      $id: { value: '1' },
      $revision: { value: '1' },
      更新者: { value: { code: 'user', name: 'User' } },
      作成者: { value: { code: 'user', name: 'User' } },
      レコード番号: { value: '1' },
      更新日時: { value: '2023-01-01T00:00:00Z' },
      作成日時: { value: '2023-01-01T00:00:00Z' },
      name: { value: 'Test Record 1' },
      url: { value: 'https://example.com' },
      username: { value: 'user1' },
      password: { value: 'pass1' },
      otpuri: { value: 'otpauth://totp/Test1' },
      shareto: { value: [] },
    },
    {
      $id: { value: '2' },
      $revision: { value: '1' },
      更新者: { value: { code: 'user', name: 'User' } },
      作成者: { value: { code: 'user', name: 'User' } },
      レコード番号: { value: '2' },
      更新日時: { value: '2023-01-02T00:00:00Z' },
      作成日時: { value: '2023-01-02T00:00:00Z' },
      name: { value: 'Test Record 2' },
      url: { value: 'https://example2.com' },
      username: { value: 'user2' },
      password: { value: 'pass2' },
      otpuri: { value: 'otpauth://totp/Test2' },
      shareto: { value: [] },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock cursor API responses
    mockKintoneApi.mockImplementation((path, method) => {
      if (path === '/k/v1/records/cursor.json' && method === 'POST') {
        return Promise.resolve({ id: 'cursor-id' });
      }
      if (path === '/k/v1/records/cursor.json' && method === 'GET') {
        return Promise.resolve({ records: mockRecords, next: false });
      }
      if (path === '/k/v1/records/cursor.json' && method === 'DELETE') {
        return Promise.resolve({});
      }
      return Promise.reject(new Error('Unexpected API call'));
    });
  });

  describe('message field', () => {
    it('should return empty message when records exist and no search query', () => {
      const { result } = renderHook(() =>
        useSearch(mockAppId, mockRecords, '')
      );

      expect(result.current.message).toBe('');
      expect(result.current.records).toEqual(mockRecords);
    });

    it('should return "まだ何も登録されていません" when no records and no search conditions', () => {
      const { result } = renderHook(() => useSearch(mockAppId, [], ''));

      expect(result.current.message).toBe('まだ何も登録されていません');
      expect(result.current.records).toEqual([]);
    });

    it('should return "一致するものがありません" when no records and search query exists', async () => {
      const { result } = renderHook(() =>
        useSearch(mockAppId, mockRecords, '')
      );

      act(() => {
        result.current.setQuery('NonExistentRecord');
      });

      await waitFor(() => {
        expect(result.current.message).toBe('一致するものがありません');
        expect(result.current.records).toEqual([]);
      });
    });

    it('should return "一致するものがありません" when no records and kintone query condition exists', () => {
      const { result } = renderHook(() =>
        useSearch(mockAppId, [], 'status = "Active"')
      );

      expect(result.current.message).toBe('一致するものがありません');
      expect(result.current.records).toEqual([]);
    });
  });

  describe('cursor API integration', () => {
    it('should use cursor API to fetch all records', async () => {
      const { result } = renderHook(() =>
        useSearch(mockAppId, mockRecords.slice(0, 1), '')
      );

      act(() => {
        result.current.setQuery('Record 2');
      });

      await waitFor(() => {
        expect(result.current.fetchedAll).toBe(true);
        expect(mockKintoneApi).toHaveBeenCalledWith(
          '/k/v1/records/cursor.json',
          'POST',
          {
            app: mockAppId,
            query: '',
            size: 500,
          }
        );
        expect(mockKintoneApi).toHaveBeenCalledWith(
          '/k/v1/records/cursor.json',
          'GET',
          {
            id: 'cursor-id',
          }
        );
      });
    });

    it('should handle multiple pages of records', async () => {
      const allRecords = [
        ...mockRecords,
        {
          $id: { value: '3' },
          $revision: { value: '1' },
          更新者: { value: { code: 'user', name: 'User' } },
          作成者: { value: { code: 'user', name: 'User' } },
          レコード番号: { value: '3' },
          更新日時: { value: '2023-01-03T00:00:00Z' },
          作成日時: { value: '2023-01-03T00:00:00Z' },
          name: { value: 'Special Record' },
          url: { value: 'https://example3.com' },
          username: { value: 'user3' },
          password: { value: 'pass3' },
          otpuri: { value: 'otpauth://totp/Test3' },
          shareto: { value: [] },
        },
      ];

      let callCount = 0;
      mockKintoneApi.mockImplementation((path, method) => {
        if (path === '/k/v1/records/cursor.json' && method === 'POST') {
          return Promise.resolve({ id: 'cursor-id' });
        }
        if (path === '/k/v1/records/cursor.json' && method === 'GET') {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({
              records: mockRecords,
              next: true,
            });
          }
          return Promise.resolve({
            records: [allRecords[2]],
            next: false,
          });
        }
        if (path === '/k/v1/records/cursor.json' && method === 'DELETE') {
          return Promise.resolve({});
        }
        return Promise.reject(new Error('Unexpected API call'));
      });

      const { result } = renderHook(() =>
        useSearch(mockAppId, mockRecords.slice(0, 2), '')
      );

      act(() => {
        result.current.setQuery('Special');
      });

      await waitFor(() => {
        expect(result.current.fetchedAll).toBe(true);
        expect(result.current.records).toHaveLength(1);
        expect(result.current.records[0].name.value).toBe('Special Record');
      });

      expect(mockKintoneApi).toHaveBeenCalledTimes(3); // POST + GET + GET
    });

    it('should delete cursor on error', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockKintoneApi.mockImplementation((path, method) => {
        if (path === '/k/v1/records/cursor.json' && method === 'POST') {
          return Promise.resolve({ id: 'cursor-id' });
        }
        if (path === '/k/v1/records/cursor.json' && method === 'GET') {
          return Promise.reject(new Error('Network error'));
        }
        if (path === '/k/v1/records/cursor.json' && method === 'DELETE') {
          return Promise.resolve({});
        }
        return Promise.reject(new Error('Unexpected API call'));
      });

      const { result } = renderHook(() =>
        useSearch(mockAppId, mockRecords, '')
      );

      act(() => {
        result.current.setQuery('Test');
      });

      await waitFor(() => {
        expect(mockKintoneApi).toHaveBeenCalledWith(
          '/k/v1/records/cursor.json',
          'DELETE',
          {
            id: 'cursor-id',
          }
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
