import React from 'react';

import AccountCard from './AccountCard';

export interface ListAppProps {
  appId: number;
  viewId: number;
  records: kintone.types.SavedFields[];
}

export default function ListApp({ appId, viewId, records }: ListAppProps) {
  return (
    <div>
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
        div {
          max-width: 1200px;
          margin: 0 auto;
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
