import { matchURL } from '@lib/search';

/**
 * 指定されたURLに最もマッチするレコードを取得する。
 * URLの長さが長いレコードを優先し、同じ長さの場合は更新日時が新しいレコードを優先する。
 *
 * @param records - 検索対象のレコードの配列
 * @param url - マッチさせるURL
 * @returns 最もマッチするレコード。見つからない場合はnull
 */
export const getBestMatch = (
  records: kintone.types.SavedFields[],
  url: string
): kintone.types.SavedFields | null => {
  let bestMatch: kintone.types.SavedFields | null = null;

  for (const record of records) {
    if (!matchURL(record.url.value, url)) {
      continue;
    }

    if (bestMatch === null) {
      bestMatch = record;
      continue;
    }

    const lengthCurrent = record.url.value.length;
    const lengthBest = bestMatch.url.value.length;

    if (lengthCurrent > lengthBest) {
      bestMatch = record;
    } else if (lengthCurrent === lengthBest) {
      const timeCurrent = new Date(record.更新日時.value).getTime();
      const timeBest = new Date(bestMatch.更新日時.value).getTime();

      if (timeCurrent > timeBest) {
        bestMatch = record;
      }
    }
  }

  return bestMatch;
};
