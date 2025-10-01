import '@testing-library/jest-dom';
import { act, renderHook, waitFor } from '@testing-library/react';

import { fetchRecords, useRecords } from './records';

// Mock chrome.runtime
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
  },
} as any;

describe('fetchRecords', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return cachedRecords when provided', async () => {
    const cachedRecords: kintone.types.SavedFields[] = [
      {
        $id: { value: '1' },
        name: { value: 'Test' },
        url: { value: 'https://example.com' },
      } as kintone.types.SavedFields,
    ];

    const result = await fetchRecords({ cachedRecords });
    expect(result).toEqual(cachedRecords);
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it('should fetch records from chrome.runtime when no initial data', async () => {
    const mockRecords: kintone.types.SavedFields[] = [
      {
        $id: { value: '1' },
        name: { value: 'Test' },
        url: { value: 'https://example.com' },
      } as kintone.types.SavedFields,
    ];

    (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
      success: true,
      data: mockRecords,
    });

    const result = await fetchRecords();
    expect(result).toEqual(mockRecords);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'GET_RECORDS',
      data: { forceRefresh: undefined },
    });
  });

  it('should force refresh when forceRefresh is true', async () => {
    const mockRecords: kintone.types.SavedFields[] = [
      {
        $id: { value: '1' },
        name: { value: 'Test' },
        url: { value: 'https://example.com' },
      } as kintone.types.SavedFields,
    ];

    (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
      success: true,
      data: mockRecords,
    });

    const result = await fetchRecords({
      cachedRecords: mockRecords,
      forceRefresh: true,
    });
    expect(result).toEqual(mockRecords);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'GET_RECORDS',
      data: { forceRefresh: true },
    });
  });

  it('should throw error when fetch fails', async () => {
    (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
      success: false,
    });

    await expect(fetchRecords()).rejects.toThrow('Failed to fetch records');
  });
});

describe('useRecords', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should initialize with loading state', async () => {
    const mockRecords: kintone.types.SavedFields[] = [
      {
        $id: { value: '1' },
        name: { value: 'Test' },
        url: { value: 'https://example.com' },
      } as kintone.types.SavedFields,
    ];

    (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
      success: true,
      data: mockRecords,
    });

    const { result } = renderHook(() => useRecords());

    expect(result.current.loading).toBe(true);
    expect(result.current.records).toEqual([]);

    // Wait for async operations to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should load records on mount', async () => {
    const mockRecords: kintone.types.SavedFields[] = [
      {
        $id: { value: '1' },
        name: { value: 'Test' },
        url: { value: 'https://example.com' },
      } as kintone.types.SavedFields,
    ];

    (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
      success: true,
      data: mockRecords,
    });

    const { result } = renderHook(() => useRecords());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.records).toEqual(mockRecords);
    expect(result.current.fetchError).toBe(false);
  });

  it('should use cachedRecords when provided', async () => {
    const mockRecords: kintone.types.SavedFields[] = [
      {
        $id: { value: '1' },
        name: { value: 'Test' },
        url: { value: 'https://example.com' },
      } as kintone.types.SavedFields,
    ];

    const { result } = renderHook(() => useRecords(mockRecords));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.records).toEqual(mockRecords);
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it('should handle fetch errors', async () => {
    (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
      success: false,
    });

    const { result } = renderHook(() => useRecords());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.fetchError).toBe(true);
    expect(result.current.records).toEqual([]);
  });

  it('should refresh records when refresh is called', async () => {
    const mockRecords: kintone.types.SavedFields[] = [
      {
        $id: { value: '1' },
        name: { value: 'Test' },
        url: { value: 'https://example.com' },
      } as kintone.types.SavedFields,
    ];

    const newRecords: kintone.types.SavedFields[] = [
      {
        $id: { value: '2' },
        name: { value: 'New Test' },
        url: { value: 'https://example2.com' },
      } as kintone.types.SavedFields,
    ];

    (chrome.runtime.sendMessage as jest.Mock)
      .mockResolvedValueOnce({
        success: true,
        data: mockRecords,
      })
      .mockResolvedValueOnce({
        success: true,
        data: newRecords,
      });

    const { result } = renderHook(() => useRecords());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.records).toEqual(mockRecords);

    // Call refresh
    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.refreshing).toBe(false);
    });

    expect(result.current.records).toEqual(newRecords);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(2);
    expect(chrome.runtime.sendMessage).toHaveBeenLastCalledWith({
      type: 'GET_RECORDS',
      data: { forceRefresh: true },
    });
  });
});
