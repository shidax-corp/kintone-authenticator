const escapeRegex = (str: string) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const wildcardToRegex = (pattern: string) => {
  const escaped = escapeRegex(pattern);
  const withWildcards = escaped.replace(/\\\*/g, '.*');

  if (
    withWildcards.startsWith('http://') ||
    withWildcards.startsWith('https://')
  ) {
    return new RegExp(`^${withWildcards}`, 'i');
  }
  return new RegExp(`${withWildcards}`, 'i');
};

const matchURL = (url: string, pattern: string) => {
  try {
    const regex = wildcardToRegex(pattern);
    return regex.test(url);
  } catch {
    return false;
  }
};

/**
 * 一致するレコードを検索する。
 *
 * 名前に対しては単純な部分一致で検索する。
 * URLはワイルドカード対応で、さらに先頭にhttp://またはhttps://があるかどうかで前方一致か部分一致かを決めている。
 *
 * @param records - 検索対象のレコードの配列
 * @param query - 検索クエリ
 * @returns 一致するレコードの配列
 */
export function filterRecords<T extends kintone.types.Fields>(
  records: T[],
  query: string
): T[] {
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
}
