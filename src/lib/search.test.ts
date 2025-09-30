/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { act, renderHook, waitFor } from '@testing-library/react';

import { filterRecords, matchURL, useSearch } from '@lib/search';

describe('matchURL', () => {
  it('should return false if urlPattern is empty', () => {
    expect(matchURL('', 'test')).toBe(false);
  });

  it('should return true if query is empty', () => {
    expect(matchURL('https://example.com', '')).toBe(true);
  });

  it('should return true if query is contained in urlPattern', () => {
    expect(matchURL('https://example.com/path', 'example')).toBe(true);
  });

  it('should handle wildcard patterns', () => {
    expect(matchURL('https://*.example.com', 'https://sub.example.com')).toBe(
      true
    );
    expect(matchURL('https://*.example.com', 'https://other.com')).toBe(false);
  });

  it('should handle URL prefix matching', () => {
    expect(matchURL('https://example.com/path', 'https://example.com')).toBe(
      true
    );
    expect(matchURL('https://example.com', 'https://example.com/path')).toBe(
      true
    );
  });
});

describe('filterRecords', () => {
  const R = (name: string, url: string) => ({
    name: { value: name },
    url: { value: url },
    otpuri: { value: '' },
    password: { value: '' },
    username: { value: '' },
    shareto: { value: [] },
  });

  const records = [
    R('Alice', 'https://example.com/alice'),
    R('Bob', 'https://bob.example.com/bob'),
    R('Charlie', 'https://charlie.example.com/bob/charlie'),
    R('David', 'https://*.example.com/david'),
  ];

  const tests = [
    {
      query: 'Alice',
      expected: [R('Alice', 'https://example.com/alice')],
    },
    {
      query: 'bob',
      expected: [
        R('Bob', 'https://bob.example.com/bob'),
        R('Charlie', 'https://charlie.example.com/bob/charlie'),
      ],
    },
    {
      query: 'https://ex',
      expected: [R('Alice', 'https://example.com/alice')],
    },
    {
      query: 'https://bob.example.com/bob',
      expected: [R('Bob', 'https://bob.example.com/bob')],
    },
    {
      query: '.example.com/bob',
      expected: [
        R('Bob', 'https://bob.example.com/bob'),
        R('Charlie', 'https://charlie.example.com/bob/charlie'),
      ],
    },
    {
      query: 'char bob',
      expected: [R('Charlie', 'https://charlie.example.com/bob/charlie')],
    },
    {
      query: 'exa bo',
      expected: [
        R('Bob', 'https://bob.example.com/bob'),
        R('Charlie', 'https://charlie.example.com/bob/charlie'),
      ],
    },
    {
      query: 'https://foobar.example.com',
      expected: [R('David', 'https://*.example.com/david')],
    },
    {
      query: 'https://foobar.example.com/david?abc=123',
      expected: [R('David', 'https://*.example.com/david')],
    },
    {
      query: '',
      expected: records,
    },
    {
      query: 'nonexistent',
      expected: [],
    },
  ];

  it.each(tests)(
    'should filter records for query "$query"',
    ({ query, expected }) => {
      const result = filterRecords(records, query);
      expect(result).toEqual(expected);
    }
  );
});

describe('useSearch', () => {
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

  describe('message field', () => {
    it('should return empty message when records exist and no search query', () => {
      const { result } = renderHook(() =>
        useSearch(
          {
            getInitialRecords: () => mockRecords,
          },
          ''
        )
      );

      expect(result.current.message).toBe('');
      expect(result.current.records).toEqual(mockRecords);
    });

    it('should return "まだ何も登録されていません" when no records and no search conditions', () => {
      const { result } = renderHook(() =>
        useSearch(
          {
            getInitialRecords: () => [],
          },
          ''
        )
      );

      expect(result.current.message).toBe('まだ何も登録されていません');
      expect(result.current.records).toEqual([]);
    });

    it('should return "一致するものがありません" when no records and search query exists', async () => {
      const { result } = renderHook(() =>
        useSearch(
          {
            getInitialRecords: () => mockRecords,
          },
          ''
        )
      );

      act(() => {
        result.current.setQuery('NonExistentRecord');
      });

      await waitFor(() => {
        expect(result.current.message).toBe('一致するものがありません');
        expect(result.current.records).toEqual([]);
      });
    });

    it('should return "一致するものがありません" when no records and queryCondition exists', () => {
      const { result } = renderHook(() =>
        useSearch(
          {
            getInitialRecords: () => [],
          },
          'status = "Active"'
        )
      );

      expect(result.current.message).toBe('一致するものがありません');
      expect(result.current.records).toEqual([]);
    });

    it('should return empty message when search results exist', async () => {
      const { result } = renderHook(() =>
        useSearch(
          {
            getInitialRecords: () => mockRecords,
          },
          ''
        )
      );

      act(() => {
        result.current.setQuery('Test Record 1');
      });

      await waitFor(() => {
        expect(result.current.message).toBe('');
        expect(result.current.records).toHaveLength(1);
        expect(result.current.records[0].name.value).toBe('Test Record 1');
      });
    });

    it('should clear message when search query is cleared and records exist', async () => {
      const { result } = renderHook(() =>
        useSearch(
          {
            getInitialRecords: () => mockRecords,
          },
          ''
        )
      );

      act(() => {
        result.current.setQuery('NonExistent');
      });

      await waitFor(() => {
        expect(result.current.message).toBe('一致するものがありません');
      });

      act(() => {
        result.current.setQuery('');
      });

      await waitFor(() => {
        expect(result.current.message).toBe('');
        expect(result.current.records).toEqual(mockRecords);
      });
    });
  });

  describe('basic functionality', () => {
    it('should initialize with provided records', () => {
      const { result } = renderHook(() =>
        useSearch(
          {
            getInitialRecords: () => mockRecords,
          },
          ''
        )
      );

      expect(result.current.query).toBe('');
      expect(result.current.records).toEqual(mockRecords);
      expect(result.current.fetchedAll).toBe(false);
    });

    it('should filter records based on query', async () => {
      const { result } = renderHook(() =>
        useSearch(
          {
            getInitialRecords: () => mockRecords,
          },
          ''
        )
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
        useSearch(
          {
            getInitialRecords: () => mockRecords,
          },
          ''
        )
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

    it('should fetch all records when search query is entered', async () => {
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

      const getAllRecordsMock = jest.fn().mockResolvedValue(allRecords);

      const { result } = renderHook(() =>
        useSearch(
          {
            getInitialRecords: () => mockRecords.slice(0, 2),
            getAllRecords: getAllRecordsMock,
          },
          ''
        )
      );

      act(() => {
        result.current.setQuery('Special');
      });

      await waitFor(() => {
        expect(result.current.fetchedAll).toBe(true);
        expect(result.current.records).toHaveLength(1);
        expect(result.current.records[0].name.value).toBe('Special Record');
        expect(result.current.message).toBe('');
      });

      expect(getAllRecordsMock).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      jest.useFakeTimers();
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const getAllRecordsMock = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockRecords);

      const { result } = renderHook(() =>
        useSearch(
          {
            getInitialRecords: () => [],
            getAllRecords: getAllRecordsMock,
          },
          ''
        )
      );

      act(() => {
        result.current.setQuery('Test');
      });

      await waitFor(() => {
        expect(getAllRecordsMock).toHaveBeenCalledTimes(1);
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(getAllRecordsMock).toHaveBeenCalledTimes(2);
        expect(result.current.fetchedAll).toBe(true);
      });

      consoleErrorSpy.mockRestore();
      jest.useRealTimers();
    });
  });
});
