import React from 'react';

import AccountCard from './AccountCard';

export interface ListAppProps {
  appId: number;
  records: kintone.types.SavedFields[];
}

export default function ListApp({ appId, records }: ListAppProps) {
  return (
    <div>
      <ul>
        {records.map((record) => (
          <AccountCard account={record} key={record.$id.value} />
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
