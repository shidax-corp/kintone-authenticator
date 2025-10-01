import { useCallback, useEffect, useState } from 'react';

/**
 * Chrome拡張でレコードを取得する純粋関数。
 *
 * @param options.cachedRecords - 既にキャッシュされているレコード
 * @param options.forceRefresh - 強制的に再取得するか
 * @returns レコードの配列
 */
export async function fetchRecords(options?: {
  cachedRecords?: kintone.types.SavedFields[];
  forceRefresh?: boolean;
}): Promise<kintone.types.SavedFields[]> {
  // 既にレコードがある場合はそれを返す
  if (!options?.forceRefresh && options?.cachedRecords) {
    return options.cachedRecords;
  }

  // chrome.runtime.sendMessage でレコード取得
  const response = await chrome.runtime.sendMessage({
    type: 'GET_RECORDS',
    data: { forceRefresh: options?.forceRefresh },
  });

  if (response.success) {
    return response.data;
  } else {
    throw new Error(
      `Failed to fetch records. Response: ${JSON.stringify(response)}`
    );
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
 * @param cachedRecords - 既にキャッシュされているレコード
 * @returns レコード、loading状態、refresh関数等
 */
export function useRecords(
  cachedRecords?: kintone.types.SavedFields[]
): UseRecordsResult {
  const hasCachedRecords = !!cachedRecords;

  const [records, setRecords] = useState<kintone.types.SavedFields[]>(
    cachedRecords || []
  );
  const [loading, setLoading] = useState(!hasCachedRecords);
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
          cachedRecords,
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
    [cachedRecords]
  );

  useEffect(() => {
    // 初期レコードが既にある場合は非同期ロードをスキップ
    if (!cachedRecords) {
      loadRecords();
    }
  }, [loadRecords, cachedRecords]);

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
