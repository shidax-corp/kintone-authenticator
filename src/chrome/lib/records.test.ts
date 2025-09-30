import '@testing-library/jest-dom';
import { renderHook, waitFor } from '@testing-library/react';

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

  it('should return allRecords when provided', async () => {
    const allRecords: kintone.types.SavedFields[] = [
      {
        $id: { value: '1' },
        name: { value: 'Test' },
        url: { value: 'https://example.com' },
      } as kintone.types.SavedFields,
    ];

    const result = await fetchRecords({ allRecords });
    expect(result).toEqual(allRecords);
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it('should return initialRecords when allRecords is not provided', async () => {
    const initialRecords: kintone.types.SavedFields[] = [
      {
        $id: { value: '1' },
        name: { value: 'Test' },
        url: { value: 'https://example.com' },
      } as kintone.types.SavedFields,
    ];

    const result = await fetchRecords({ initialRecords });
    expect(result).toEqual(initialRecords);
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
      allRecords: mockRecords,
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

  it('should initialize with loading state', () => {
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

  it('should use initialRecords when provided', async () => {
    const mockRecords: kintone.types.SavedFields[] = [
      {
        $id: { value: '1' },
        name: { value: 'Test' },
        url: { value: 'https://example.com' },
      } as kintone.types.SavedFields,
    ];

    const { result } = renderHook(() =>
      useRecords({ initialRecords: mockRecords })
    );

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
    await result.current.refresh();

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
