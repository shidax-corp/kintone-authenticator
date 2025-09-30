import { useEffect } from 'react';

import SearchField from '@components/SearchField';

import useElementsAttributeSetter from '../../lib/elementsAttributeSetter';
import { useSearch } from '../../lib/search';
import Item from './Item';

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
  const { query, setQuery, records, fetchedAll, message } = useSearch(
    appId,
    pageRecords,
    kintone.mobile.app.getQueryCondition()
  );

  useEffect(() => {
    // アプリの背景を白にする。
    const customview = document.querySelector('.gaia-mobile-app-customview');
    if (customview instanceof HTMLElement) {
      customview.style.backgroundColor = '#fff';
    }
  }, []);

  const setCounterAttribute = useElementsAttributeSetter(
    '.gaia-mobile-v2-app-index-pager-current'
  );
  const setPagerAttribute = useElementsAttributeSetter(
    '.gaia-mobile-v2-app-index-pager-prev, .gaia-mobile-v2-app-index-pager-next'
  );

  useEffect(() => {
    if (query.trim() === '') {
      setCounterAttribute('textContent', null);
      setPagerAttribute('style', null);
    } else {
      setCounterAttribute(
        'textContent',
        `${records.length}${fetchedAll ? '' : '+'}件`
      );
      setPagerAttribute('style', 'display: none;');
    }
  }, [query, records, fetchedAll, setCounterAttribute, setPagerAttribute]);

  return (
    <div>
      <div>
        <SearchField value={query} onChange={setQuery} />
      </div>
      {message ? (
        <div className="message">
          <p>{message}</p>
        </div>
      ) : (
        <ul>
          {records.map((record) => (
            <Item
              key={record.$id.value}
              appId={appId}
              viewId={viewId}
              account={record}
            />
          ))}
        </ul>
      )}
      <style jsx>{`
        & {
          max-width: 800px;
          margin: 0 auto;
          background-color: #fff;
        }

        & > div {
          margin: 0 12px 16px;
        }

        ul {
          display: block;
          list-style: none;
        }

        ul > :global(li) {
          border-bottom: 1px solid var(--ka-bg-dark-color);
          padding: 32px 16px;
        }
        ul > :global(li:first-child) {
          padding-top: 16px;
        }
        ul > :global(li:last-child) {
          border-bottom: none;
        }

        .message {
          text-align: center;
          padding: 48px 16px;
          color: var(--ka-fg-light-color);
        }

        .message p {
          margin: 0;
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
}
