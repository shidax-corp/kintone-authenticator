/**
 * URLパターンがクエリにマッチするかどうかを判定する。
 *
 * クエリがURLパターンに含まれている場合は `true` を返す。
 * URLパターンにワイルドカード(`*`)が含まれている場合は、ワイルドカードを考慮して一致していれば `true` を返す。
 * クエリが `http://` または `https://` で始まる場合、URLパターンの先頭部分がクエリと一致すれば `true` を返す。この場合、URLパターンとクエリのどちらが長くても、与えられた範囲で一致していれば `true` になる。
 */
export const matchURL = (urlPattern: string, query: string): boolean => {
  if (!urlPattern) {
    return false;
  }
  if (!query) {
    return true;
  }

  if (urlPattern.includes(query)) {
    return true;
  }

  const escape = (str: string) => str.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

  const regexp = new RegExp(escape(urlPattern).replace(/\*/g, '.*'));
  if (regexp.test(query)) {
    return true;
  }

  if (query.match(/^https?:\/\/../)) {
    let [proto, rest] = urlPattern.split(/(?<=:\/\/.)/, 2);
    const frontMatch =
      '^' +
      escape(proto).replace(/\*/g, '.*') +
      rest.replace(/./g, (c) => {
        return `(?:${escape(c).replace(/\*/g, '.*')}`;
      }) +
      '|$)'.repeat(rest.length);
    const frontRegexp = new RegExp(frontMatch);

    const m = frontRegexp.exec(query);
    if (m && m.length <= query.length) {
      return true;
    }
  }

  return false;
};

/**
 * 一致するレコードを検索する。
 *
 * 名前に対しては単純な部分一致で検索する。
 * URLについては、 `matchURL` 関数を使用して、ワイルドカードを含むパターンマッチングを行う。
 *
 * @param records - 検索対象のレコードの配列
 * @param query - 検索クエリ
 * @returns 一致するレコードの配列
 */
export const filterRecords = <T extends kintone.types.Fields>(
  records: T[],
  query: string
): T[] => {
  if (query === '') {
    return records;
  }

  const lowerQueries = query.toLowerCase().split(/\s+/);

  return records.filter((record) => {
    return lowerQueries.every((q) => {
      if (record.name.value.toLowerCase().includes(q)) {
        return true;
      }
      if (matchURL(record.url.value, q)) {
        return true;
      }
      return false;
    });
  });
};
