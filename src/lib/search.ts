import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * URLパターンがクエリにマッチするかどうかを判定する。
 *
 * クエリがURLパターンに含まれている場合は `true` を返す。
 * URLパターンにワイルドカード(`*`)が含まれている場合は、ワイルドカードを考慮して一致していれば `true` を返す。
 * クエリが `http://` または `https://` で始まる場合、URLパターンの先頭部分がクエリと一致すれば `true` を返す。この場合、URLパターンとクエリのどちらが長くても、与えられた範囲で一致していれば `true` になる。
 */
export const matchURL = (urlPattern: string, query: string): boolean => {
  if (!urlPattern) {
    return false;
  }
  if (!query) {
    return true;
  }

  if (urlPattern.includes(query)) {
    return true;
  }

  const escape = (str: string) => str.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

  const regexp = new RegExp(escape(urlPattern).replace(/\*/g, '.*'));
  if (regexp.test(query)) {
    return true;
  }

  if (query.match(/^https?:\/\/../)) {
    let [proto, rest] = urlPattern.split(/(?<=:\/\/.)/, 2);
    while (proto.endsWith('*')) {
      proto += rest[0];
      rest = rest.slice(1);
    }
    const frontMatch =
      '^' +
      escape(proto).replace(/\*/g, '.*') +
      rest.replace(/./g, (c) => {
        return `(?:${escape(c).replace(/\*/g, '.*')}`;
      }) +
      '|$)'.repeat(rest.length);
    const frontRegexp = new RegExp(frontMatch);

    const m = frontRegexp.exec(query);
    if (m && m.length <= query.length) {
      return true;
    }
  }

  return false;
};

/**
 * 一致するレコードを検索する。
 *
 * 名前に対しては単純な部分一致で検索する。
 * URLについては、 `matchURL` 関数を使用して、ワイルドカードを含むパターンマッチングを行う。
 *
 * @param records - 検索対象のレコードの配列
 * @param query - 検索クエリ
 * @returns 一致するレコードの配列
 */
export const filterRecords = <T extends kintone.types.Fields>(
  records: T[],
  query: string
): T[] => {
  if (query === '') {
    return records;
  }

  const lowerQueries = query.toLowerCase().split(/\s+/);

  return records.filter((record) => {
    return lowerQueries.every((q) => {
      if (record.name.value.toLowerCase().includes(q)) {
        return true;
      }
      if (matchURL(record.url.value, q)) {
        return true;
      }
      return false;
    });
  });
};

export type RecordFetcher<T extends kintone.types.Fields> = {
  getInitialRecords: () => T[];
  getAllRecords?: () => Promise<T[]>;
};

export type SearchResult<T extends kintone.types.Fields> = {
  query: string;
  setQuery: (query: string) => void;
  records: T[];
  fetchedAll: boolean;
  message: string;
};

/**
 * レコード検索機能を提供するReactフック。
 *
 * @param fetcher - レコード取得を行う関数群
 * @param queryCondition - kintoneのクエリ条件（空状態メッセージの判定に使用）
 * @returns 検索クエリ、フィルタ済みレコード、メッセージ等
 */
export function useSearch<T extends kintone.types.Fields>(
  fetcher: RecordFetcher<T>,
  queryCondition: string = ''
): SearchResult<T> {
  const [query, setQuery] = useState('');
  // 初期レコードを一度だけ取得
  const [initialRecords] = useState(() => fetcher.getInitialRecords());
  const [records, setRecords] = useState<T[]>(initialRecords);
  const { allRecords, fetchAllRecords } = useAllRecords(fetcher);

  useEffect(() => {
    if (query.trim() === '') {
      setRecords(initialRecords);
      return;
    }

    // 全レコードがまだ取得されていなければ取得する。
    // レコードの取得に成功したらallRecordsが更新されてこのuseEffectが再実行されるので、ここで条件分けはしなくても動く。
    fetchAllRecords();

    // 全レコードの取得がまだの場合は、とりあえず初期から表示されているレコードの中から検索する。
    setRecords(filterRecords(allRecords ?? initialRecords, query));
  }, [query, allRecords, initialRecords, fetchAllRecords]);

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

/**
 * 全レコードを取得するカスタムフック。
 * 取得に失敗した場合の自動リトライ機能が付いている。
 *
 * @param fetcher - レコード取得を行う関数群
 * @returns allRecords - 取得した全レコードの配列。まだ取得されていない場合は null。
 * @returns fetchAllRecords - 全レコードを取得する関数。すでに取得されている場合は何もしない。
 */
const useAllRecords = <T extends kintone.types.Fields>(
  fetcher: RecordFetcher<T>
) => {
  const [allRecords, setAllRecords] = useState<T[] | null>(null);
  const [fetching, setFetching] = useState(false);
  const [shouldRetry, setShouldRetry] = useState(false);
  const retryCount = useRef(0);

  const getAllRecords = fetcher.getAllRecords;
  const fetchAllRecords = useCallback(() => {
    if (allRecords != null || fetching || !getAllRecords) return;

    setFetching(true);

    getAllRecords()
      .then((result) => {
        setAllRecords(result);
        setFetching(false);
        retryCount.current = 0;
      })
      .catch((err) => {
        console.error(err);

        if (retryCount.current < 5) {
          retryCount.current += 1;
          setFetching(false);
          setShouldRetry(true);
        } else {
          setFetching(false);
        }
      });
  }, [getAllRecords, allRecords, fetching]);

  // リトライ処理を別の useEffect に分離
  useEffect(() => {
    if (shouldRetry) {
      setShouldRetry(false);
      const timer = setTimeout(() => {
        fetchAllRecords();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldRetry, fetchAllRecords]);

  return {
    allRecords,
    fetchAllRecords,
  } as const;
};
