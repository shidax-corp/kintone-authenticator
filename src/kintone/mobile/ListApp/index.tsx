import { useEffect } from 'react';

import SearchField from '@components/SearchField';

import useElementsAttributeSetter from '../../lib/elementsAttributeSetter';
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
