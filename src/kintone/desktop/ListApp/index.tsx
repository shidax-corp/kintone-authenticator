import { useEffect } from 'react';

import SearchField from '@components/SearchField';

import useElementsAttributeSetter from '../../lib/elementsAttributeSetter';
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
  const { query, setQuery, records, fetchedAll, message } = useListSearcher(
    appId,
    pageRecords,
    kintone.app.getQueryCondition()
  );

  const setCounterAttribute = useElementsAttributeSetter(
    '.component-app-listtable-countitem-page'
  );
  const setPagerAttribute = useElementsAttributeSetter(
    '.gaia-ui-listtable-pagercomponent-prev, .gaia-ui-listtable-pagercomponent-next'
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
      setPagerAttribute('style', 'visibility: hidden;');
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
            <AccountCard
              appId={appId}
              viewId={viewId}
              account={record}
              key={record.$id.value}
            />
          ))}
        </ul>
      )}
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

        .message {
          text-align: center;
          padding: 48px 16px;
          color: #666;
        }

        .message p {
          margin: 0;
          font-size: 1.1rem;
        }
      `}</style>
    </div>
  );
}
