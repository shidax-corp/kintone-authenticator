import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { filterRecords } from '@lib/search';

export type ListSearcher = {
  query: string;
  setQuery: (query: string) => void;
  records: kintone.types.SavedFields[];
  fetchedAll: boolean;
  message: string;
};

/** レコード一覧画面での検索機能を提供する関数。
 *
 * @param appId - アプリのID。 kintone.app.getId() または kintone.mobile.app.getId() で取得できる。
 * @param initialRecords - 初期表示されているレコードの配列。 kintone.app.getRecords() または kintone.mobile.app.getRecords() で取得できる。
 * @param queryCondition - 検索条件を表す文字列。 kintone.app.getQueryCondition() または kintone.mobile.app.getQueryCondition() で取得できる。
 */
export default function useListSearcher(
  appId: number,
  initialRecords: kintone.types.SavedFields[],
  queryCondition: string
): ListSearcher {
  const [query, setQuery] = useState('');
  const { allRecords, fetchAllRecords } = useAllRecords(appId, queryCondition);

  const trimmedQuery = query.trim();

  const records = useMemo(() => {
    if (trimmedQuery === '') {
      return initialRecords;
    }

    const sourceRecords = allRecords ?? initialRecords;
    return filterRecords(sourceRecords, trimmedQuery);
  }, [trimmedQuery, allRecords, initialRecords]);

  useEffect(() => {
    if (trimmedQuery === '') {
      return;
    }

    // 全レコードがまだ取得されていなければ取得する。
    // レコードの取得に成功したらallRecordsが更新されてこのuseEffectが再実行されるので、ここで条件分けはしなくても動く。
    fetchAllRecords();
  }, [trimmedQuery, fetchAllRecords]);

  // メッセージの決定
  let message = '';
  if (records.length === 0) {
    if (query.trim() === '' && queryCondition.trim() === '') {
      message = 'まだ何も登録されていません';
    } else {
      message = '一致するものがありません';
    }
  }

  return { query, setQuery, records, fetchedAll: allRecords != null, message };
}

/** 全レコードを取得するカスタムフック。
 * 取得に失敗した場合の自動リトライ機能が付いている。
 *
 * @param appId - アプリのID。 kintone.app.getId() または kintone.mobile.app.getId() で取得できる。
 * @param queryCondition - 検索条件を表す文字列。 kintone.app.getQueryCondition() または kintone.mobile.app.getQueryCondition() で取得できる。
 * @return allRecords - 取得した全レコードの配列。まだ取得されていない場合は null。
 * @return fetchAllRecords - 全レコードを取得する関数。すでに取得されている場合は何もしない。
 */
const useAllRecords = (appId: number, queryCondition: string) => {
  const [allRecords, setAllRecords] = useState<
    kintone.types.SavedFields[] | null
  >(null);
  const [fetching, setFetching] = useState(false);
  const retryCount = useRef(0);

  const fetchAllRecordsRef = useRef<() => void>();

  const fetchAllRecords = useCallback(() => {
    if (allRecords != null || fetching) return;

    setFetching(true);

    kintone
      .api('/k/v1/records/cursor.json', 'POST', {
        app: appId,
        query: queryCondition,
        size: 500,
      })
      .then(async ({ id }) => {
        const result: kintone.types.SavedFields[] = [];

        try {
          while (true) {
            const resp = await kintone.api('/k/v1/records/cursor.json', 'GET', {
              id,
            });
            result.push(...resp.records);
            if (!resp.next) {
              break;
            }
          }
        } catch (e) {
          try {
            await kintone.api('/k/v1/records/cursor.json', 'DELETE', { id });
          } catch (e) {
            console.error(e);
          }
          throw e;
        }

        return result;
      })
      .then((result) => {
        setAllRecords(result);
        setFetching(false);
        retryCount.current = 0;
      })
      .catch((err) => {
        console.error(err);

        if (retryCount.current < 5) {
          retryCount.current += 1;
          setTimeout(() => {
            fetchAllRecordsRef.current?.();
          }, 1000);
        } else {
          setFetching(false);
        }
      });
  }, [appId, queryCondition, allRecords, fetching]);

  useEffect(() => {
    fetchAllRecordsRef.current = fetchAllRecords;
  }, [fetchAllRecords]);

  return {
    allRecords,
    fetchAllRecords,
  } as const;
};
