import { matchURL } from '@lib/search';

/**
 * マッチするレコードを優先度順に並び替える。
 * URLの長さが長いレコードを優先し、同じ長さの場合は更新日時が新しいレコードを優先する。
 *
 * @param records - 検索対象のレコードの配列
 * @param url - マッチさせるURL
 * @returns 優先度順に並び替えられたマッチするレコードの配列
 */
export const sortRecordsByPriority = (
  records: kintone.types.SavedFields[],
  url: string
): kintone.types.SavedFields[] => {
  return records
    .filter((record) => matchURL(record.url.value, url))
    .sort((a, b) => {
      const lengthA = a.url.value.length;
      const lengthB = b.url.value.length;

      if (lengthA !== lengthB) {
        return lengthB - lengthA;
      }

      const timeA = new Date(a.更新日時.value).getTime();
      const timeB = new Date(b.更新日時.value).getTime();
      return timeB - timeA;
    });
};

/**
 * 指定されたURLに最もマッチするレコードを取得する。
 *
 * @param records - 検索対象のレコードの配列
 * @param url - マッチさせるURL
 * @returns 最もマッチするレコード。見つからない場合はnull
 */
export const getBestMatch = (
  records: kintone.types.SavedFields[],
  url: string
): kintone.types.SavedFields | null => {
  const sortedRecords = sortRecordsByPriority(records, url);
  return sortedRecords[0] || null;
};
