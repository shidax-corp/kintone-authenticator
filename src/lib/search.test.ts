import { filterRecords } from '@lib/search';

describe('filterRecords', () => {
  const R = (name: string, url: string) => ({
    name: { value: name },
    url: { value: url },
    otpuri: { value: '' },
    password: { value: '' },
    username: { value: '' },
    shareto: { value: [] },
  });

  const records = [
    R('Alice', 'https://example.com/alice'),
    R('Bob', 'https://bob.example.com/bob'),
    R('Charlie', 'https://charlie.example.com/bob/charlie'),
  ];

  const tests = [
    {
      query: 'Alice',
      expected: [R('Alice', 'https://example.com/alice')],
    },
    {
      query: 'bob',
      expected: [
        R('Bob', 'https://bob.example.com/bob'),
        R('Charlie', 'https://charlie.example.com/bob/charlie'),
      ],
    },
    {
      query: 'https://ex',
      expected: [R('Alice', 'https://example.com/alice')],
    },
    {
      query: 'https://bob.example.com/bob',
      expected: [R('Bob', 'https://bob.example.com/bob')],
    },
    {
      query: 'https://*.example.com/bob',
      expected: [
        R('Bob', 'https://bob.example.com/bob'),
        R('Charlie', 'https://charlie.example.com/bob/charlie'),
      ],
    },
    {
      query: 'char bob',
      expected: [R('Charlie', 'https://charlie.example.com/bob/charlie')],
    },
    {
      query: 'exa bo',
      expected: [
        R('Bob', 'https://bob.example.com/bob'),
        R('Charlie', 'https://charlie.example.com/bob/charlie'),
      ],
    },
    {
      query: '',
      expected: records,
    },
    {
      query: 'nonexistent',
      expected: [],
    },
  ];

  it.each(tests)(
    'should filter records for query "$query"',
    ({ query, expected }) => {
      const result = filterRecords(records, query);
      expect(result).toEqual(expected);
    }
  );
});
