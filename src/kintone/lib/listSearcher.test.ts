import '@testing-library/jest-dom';
import { act, renderHook, waitFor } from '@testing-library/react';

import useListSearcher from './listSearcher';

// Mock filterRecords from @lib/search
jest.mock('@lib/search', () => ({
  filterRecords: jest.fn(
    (records: kintone.types.SavedFields[], query: string) => {
      if (!query.trim()) return records;
      return records.filter((record) =>
        record.name.value.toLowerCase().includes(query.toLowerCase())
      );
    }
  ),
}));

// Mock kintone API
const mockKintoneApi = jest.fn();
global.kintone = {
  api: mockKintoneApi,
} as any;

describe('useListSearcher', () => {
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
        useListSearcher(mockAppId, mockRecords, '')
      );

      expect(result.current.message).toBe('');
      expect(result.current.records).toEqual(mockRecords);
    });

    it('should return "まだ何も登録されていません" when no records and no search conditions', () => {
      const { result } = renderHook(() => useListSearcher(mockAppId, [], ''));

      expect(result.current.message).toBe('まだ何も登録されていません');
      expect(result.current.records).toEqual([]);
    });

    it('should return "一致するものがありません" when no records and search query exists', async () => {
      const { result } = renderHook(() =>
        useListSearcher(mockAppId, mockRecords, '')
      );

      // Set search query that doesn't match any records
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
        useListSearcher(mockAppId, [], 'status = "Active"')
      );

      expect(result.current.message).toBe('一致するものがありません');
      expect(result.current.records).toEqual([]);
    });

    it('should return empty message when search results exist', async () => {
      const { result } = renderHook(() =>
        useListSearcher(mockAppId, mockRecords, '')
      );

      // Set search query that matches records
      act(() => {
        result.current.setQuery('Test Record 1');
      });

      await waitFor(() => {
        expect(result.current.message).toBe('');
        expect(result.current.records).toHaveLength(1);
        expect(result.current.records[0].name.value).toBe('Test Record 1');
      });
    });

    it('should return "一致するものがありません" when search query and kintone condition both exist but no matches', () => {
      const { result } = renderHook(() =>
        useListSearcher(mockAppId, [], 'status = "Active"')
      );

      act(() => {
        result.current.setQuery('NonExistent');
      });

      expect(result.current.message).toBe('一致するものがありません');
      expect(result.current.records).toEqual([]);
    });

    it('should clear message when search query is cleared and records exist', async () => {
      const { result } = renderHook(() =>
        useListSearcher(mockAppId, mockRecords, '')
      );

      // First set a query that returns no results
      act(() => {
        result.current.setQuery('NonExistent');
      });

      await waitFor(() => {
        expect(result.current.message).toBe('一致するものがありません');
      });

      // Clear the query
      act(() => {
        result.current.setQuery('');
      });

      await waitFor(() => {
        expect(result.current.message).toBe('');
        expect(result.current.records).toEqual(mockRecords);
      });
    });

    it('should handle fetching all records and update message accordingly', async () => {
      // Mock API to return additional records
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

      mockKintoneApi.mockImplementation((path, method) => {
        if (path === '/k/v1/records/cursor.json' && method === 'POST') {
          return Promise.resolve({ id: 'cursor-id' });
        }
        if (path === '/k/v1/records/cursor.json' && method === 'GET') {
          return Promise.resolve({ records: allRecords, next: false });
        }
        return Promise.reject(new Error('Unexpected API call'));
      });

      const { result } = renderHook(() =>
        useListSearcher(mockAppId, mockRecords.slice(0, 2), '')
      );

      // Search for a record that only exists in all records
      act(() => {
        result.current.setQuery('Special');
      });

      await waitFor(() => {
        expect(result.current.fetchedAll).toBe(true);
        expect(result.current.records).toHaveLength(1);
        expect(result.current.records[0].name.value).toBe('Special Record');
        expect(result.current.message).toBe('');
      });
    });
  });

  describe('existing functionality', () => {
    it('should initialize with provided records', () => {
      const { result } = renderHook(() =>
        useListSearcher(mockAppId, mockRecords, '')
      );

      expect(result.current.query).toBe('');
      expect(result.current.records).toEqual(mockRecords);
      expect(result.current.fetchedAll).toBe(false);
    });

    it('should filter records based on query', async () => {
      const { result } = renderHook(() =>
        useListSearcher(mockAppId, mockRecords, '')
      );

      act(() => {
        result.current.setQuery('Record 1');
      });

      await waitFor(() => {
        expect(result.current.records).toHaveLength(1);
        expect(result.current.records[0].name.value).toBe('Test Record 1');
      });
    });

    it('should reset to initial records when query is cleared', async () => {
      const { result } = renderHook(() =>
        useListSearcher(mockAppId, mockRecords, '')
      );

      act(() => {
        result.current.setQuery('Record 1');
      });

      await waitFor(() => {
        expect(result.current.records).toHaveLength(1);
      });

      act(() => {
        result.current.setQuery('');
      });

      await waitFor(() => {
        expect(result.current.records).toEqual(mockRecords);
      });
    });
  });
});
