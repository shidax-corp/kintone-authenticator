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

  const countElements = useRef<HTMLElement[]>([]);
  const pagerElements = useRef<HTMLElement[]>([]);

  useEffect(() => {
    countElements.current = [
      ...document.querySelectorAll('.component-app-listtable-countitem-page'),
    ].filter((elm): elm is HTMLElement => elm instanceof HTMLElement);

    for (const elm of countElements.current) {
      elm.dataset.originalCount = elm.textContent;
    }

    pagerElements.current = [
      ...document.querySelectorAll('.gaia-ui-listtable-pagercomponent-prev'),
      ...document.querySelectorAll('.gaia-ui-listtable-pagercomponent-next'),
    ].filter((elm): elm is HTMLElement => elm instanceof HTMLElement);

    for (const elm of pagerElements.current) {
      if (elm.classList.contains('pager-disable')) {
        elm.dataset.disable = 'true';
      }
    }
  }, []);

  useEffect(() => {
    if (query.trim() === '') {
      for (const elm of countElements.current) {
        elm.textContent = elm.dataset.originalCount || '';
      }
      for (const elm of pagerElements.current) {
        if (elm.dataset.disable !== 'true') {
          elm.classList.remove('pager-disable');
        }
      }
    } else {
      for (const elm of countElements.current) {
        elm.textContent = `${records.length}${fetchedAll ? '' : '+'}件`;
      }
      for (const elm of pagerElements.current) {
        elm.classList.add('pager-disable');
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
