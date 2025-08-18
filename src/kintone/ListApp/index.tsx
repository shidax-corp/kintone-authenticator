import React, { useCallback, useEffect, useState } from 'react';

import { filterRecords } from '@lib/search';

import SearchField from '@components/SearchField';

import AccountCard from './AccountCard';

export interface ListAppProps {
  appId: number;
  viewId: number;
  records: kintone.types.SavedFields[];
}

const FETCH_DEBOUNCE_TIME = 1000; // 検索用データの取得に失敗した場合にリトライを許可するまでの時間（ミリ秒）

export default function ListApp({
  appId,
  viewId,
  records: pageRecords,
}: ListAppProps) {
  const [query, setQuery] = useState('');
  const [records, setRecords] =
    useState<kintone.types.SavedFields[]>(pageRecords);
  const [allRecords, setAllRecords] = useState<
    kintone.types.SavedFields[] | null
  >(null);
  const [fetchDebounce, setFetchDebounce] = useState(0);

  const setHitCount = useCallback((count: number | null) => {
    const hitCountElements = document.querySelectorAll(
      '.component-app-listtable-countitem-page'
    );
    for (const elm of hitCountElements) {
      if (elm instanceof HTMLElement) {
        if (!elm.dataset.originalCount) {
          elm.dataset.originalCount = elm.textContent || '';
        }
        if (count === null) {
          elm.textContent = elm.dataset.originalCount || '';
        } else {
          elm.textContent = `${count}件ヒット`;
        }
      }
    }
  }, []);

  const fetchAllRecords = useCallback(async () => {
    if (allRecords || fetchDebounce) return; // 既に全レコードが取得済み
    if (Date.now() < fetchDebounce) return; // まだデータを未取得だが、失敗したばかりなのでリトライしない。
    setFetchDebounce(Date.now() + FETCH_DEBOUNCE_TIME);

    const result: kintone.types.SavedFields[] = [];

    let cursor: string;

    try {
      cursor = (
        await kintone.api('/k/v1/records/cursor.json', 'POST', {
          app: appId,
          query: kintone.app.getQueryCondition(),
          size: 500,
        })
      ).id;
    } catch (error) {
      console.error('Failed to create cursor:', error);
      return;
    }

    try {
      while (true) {
        const response = await kintone.api('/k/v1/records/cursor.json', 'GET', {
          id: cursor,
        });

        result.push(...response.records);

        if (!response.next) {
          break;
        }
      }
    } catch (error) {
      console.error('Failed to fetch all records:', error);

      try {
        await kintone.api('/k/v1/records/cursor.json', 'DELETE', {
          id: cursor,
        });
      } catch (deleteError) {
        console.error('Failed to delete cursor:', deleteError);
      }

      return;
    }

    setAllRecords(result);
    setFetchDebounce(0); // 成功したのでリトライタイマーをリセット
  }, [appId, allRecords, fetchDebounce]);

  useEffect(() => {
    if (query === '') {
      setRecords(pageRecords);
      setHitCount(null);
      return;
    }

    let targetRecords = pageRecords; // とりあえず検索対象はページ内とする。
    if (allRecords) {
      targetRecords = allRecords; // 全レコードを取得済みならそれを使用する。
    } else {
      fetchAllRecords(); // 取得前ならひとまず今あるレコードを検索しつつ、その間に全レコードを取得する。
    }

    const filteredRecords = filterRecords(targetRecords, query);
    setHitCount(filteredRecords.length);
    setRecords(filteredRecords);
  }, [query, pageRecords, allRecords, fetchAllRecords, setHitCount]);

  return (
    <div>
      <div>
        <SearchField value={query} onChange={setQuery} />
      </div>
      <ul>
        {records.map((record) => (
          <AccountCard
            appId={appId}
            viewId={viewId}
            account={record}
            key={record.$id.value}
          />
        ))}
      </ul>
      <style jsx>{`
        & {
          max-width: 1200px;
          margin: 0 auto;
        }

        & > div {
          margin: 8px 8px 16px;
        }

        ul {
          display: block;
          list-style: none;
          padding: 8px;
          margin: 0;
          columns: 30rem 3;
        }
        ul > :global(li) {
          break-inside: avoid;
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
}
