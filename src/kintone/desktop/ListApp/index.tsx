import { useEffect, useRef } from 'react';

import SearchField from '@components/SearchField';

import useListSearcher from '../../lib/listSearcher';
import AccountCard from './AccountCard';

export interface ListAppProps {
  appId: number;
  viewId: number;
  records: kintone.types.SavedFields[];
}

export default function ListApp({
  appId,
  viewId,
  records: pageRecords,
}: ListAppProps) {
  const { query, setQuery, records, fetchedAll } = useListSearcher(
    appId,
    pageRecords,
    kintone.app.getQueryCondition()
  );

  const countElement = useRef<HTMLElement[]>([]);

  useEffect(() => {
    countElement.current = [
      ...document.querySelectorAll('.component-app-listtable-countitem-page'),
    ].filter((elm): elm is HTMLElement => elm instanceof HTMLElement);

    for (const elm of countElement.current) {
      elm.dataset.originalCount = elm.textContent;
    }
  }, []);

  useEffect(() => {
    for (const elm of countElement.current) {
      if (query.trim() === '') {
        elm.textContent = elm.dataset.originalCount || '';
      } else if (!fetchedAll) {
        elm.textContent = `${records.length}+件`;
      } else {
        elm.textContent = `${records.length}件`;
      }
    }
  }, [query, records, fetchedAll]);

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
