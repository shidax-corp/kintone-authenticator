import React from 'react';

export interface ListAppProps {
  appId: number;
  records: kintone.types.SavedFields[];
}

export default function ListApp({ appId, records }: ListAppProps) {
  return (
    <div>
      <ul>
        {records.map((record) => (
          <li key={record.$id.value}>
            <a href={`/k/${appId}/show#record=${record.$id.value}`}>
              {record.name.value} ({record.$id.value})
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
