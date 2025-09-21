import { useEffect, useRef } from 'react';

import SearchField from '@components/SearchField';

import useListSearcher from '../../lib/listSearcher';

export interface ListAppProps {
  appId: number;
  viewId: number;
  records: kintone.types.SavedFields[];
}

export default function ListApp({ appId, records: pageRecords }: ListAppProps) {
  const { query, setQuery, records, fetchedAll } = useListSearcher(
    appId,
    pageRecords,
    kintone.mobile.app.getQueryCondition()
  );

  const countElements = useRef<HTMLElement[]>([]);
  const pagerElements = useRef<HTMLElement[]>([]);

  useEffect(() => {
    countElements.current = [
      ...document.querySelectorAll('.gaia-mobile-v2-app-index-pager-current'),
    ].filter((elm): elm is HTMLElement => elm instanceof HTMLElement);

    for (const elm of countElements.current) {
      elm.dataset.originalCount = elm.textContent;
    }

    pagerElements.current = [
      ...document.querySelectorAll('.gaia-mobile-v2-app-index-pager-prev'),
      ...document.querySelectorAll('.gaia-mobile-v2-app-index-pager-next'),
    ].filter((elm): elm is HTMLElement => elm instanceof HTMLElement);
  }, []);

  useEffect(() => {
    if (query.trim() === '') {
      for (const elm of countElements.current) {
        elm.textContent = elm.dataset.originalCount || '';
      }
      for (const elm of pagerElements.current) {
        elm.style.display = '';
      }
    } else {
      for (const elm of countElements.current) {
        elm.textContent = `${records.length}${fetchedAll ? '' : '+'}件`;
      }
      for (const elm of pagerElements.current) {
        elm.style.display = 'none';
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
          <div key={record.$id.value}>{JSON.stringify(record, null, 2)}</div>
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
