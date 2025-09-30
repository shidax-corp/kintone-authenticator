import { useCallback, useEffect, useState } from 'react';

/**
 * Chrome拡張でレコードを取得する純粋関数。
 *
 * @param options.initialRecords - 既に取得済みのレコード
 * @param options.allRecords - 全レコード（既取得の場合）
 * @param options.forceRefresh - 強制的に再取得するか
 * @returns レコードの配列
 */
export async function fetchRecords(options?: {
  initialRecords?: kintone.types.SavedFields[];
  allRecords?: kintone.types.SavedFields[];
  forceRefresh?: boolean;
}): Promise<kintone.types.SavedFields[]> {
  // 既にレコードがある場合はそれを返す
  if (
    !options?.forceRefresh &&
    (options?.allRecords || options?.initialRecords)
  ) {
    return options.allRecords || options.initialRecords || [];
  }

  // chrome.runtime.sendMessage でレコード取得
  const response = await chrome.runtime.sendMessage({
    type: 'GET_RECORDS',
    data: { forceRefresh: options?.forceRefresh },
  });

  if (response.success) {
    return response.data;
  } else {
    throw new Error('Failed to fetch records');
  }
}

export type UseRecordsResult = {
  records: kintone.types.SavedFields[];
  loading: boolean;
  refreshing: boolean;
  fetchError: boolean;
  refresh: () => Promise<void>;
};

/**
 * Chrome拡張でレコードを取得し、状態を管理するReactフック。
 *
 * @param options.initialRecords - 既に取得済みのレコード
 * @param options.allRecords - 全レコード（既取得の場合）
 * @returns レコード、loading状態、refresh関数等
 */
export function useRecords(options?: {
  initialRecords?: kintone.types.SavedFields[];
  allRecords?: kintone.types.SavedFields[];
}): UseRecordsResult {
  const [records, setRecords] = useState<kintone.types.SavedFields[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const loadRecords = useCallback(
    async (forceRefresh = false) => {
      try {
        setFetchError(false);
        if (forceRefresh) {
          setRefreshing(true);
        }

        const data = await fetchRecords({
          initialRecords: options?.initialRecords,
          allRecords: options?.allRecords,
          forceRefresh,
        });

        setRecords(data);
      } catch {
        setFetchError(true);
        setRecords([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [options?.initialRecords, options?.allRecords]
  );

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const refresh = useCallback(async () => {
    await loadRecords(true);
  }, [loadRecords]);

  return {
    records,
    loading,
    refreshing,
    fetchError,
    refresh,
  };
}
