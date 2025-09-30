import { type SearchResult, useSearch as useSearchBase } from '@lib/search';

/**
 * kintoneアプリ用の検索フック。
 * カーソルAPIを使用して全レコードを取得する。
 *
 * @param appId - アプリID
 * @param initialRecords - 初期表示レコード（ページに表示されているレコード）
 * @param queryCondition - kintoneのクエリ条件
 * @returns 検索クエリ、フィルタ済みレコード、メッセージ等
 */
export function useSearch(
  appId: number,
  initialRecords: kintone.types.SavedFields[],
  queryCondition: string
): SearchResult<kintone.types.SavedFields> {
  return useSearchBase(
    {
      getInitialRecords: () => initialRecords,
      getAllRecords: async () => {
        // カーソルAPIで全レコード取得（500件ずつ）
        const { id } = await kintone.api('/k/v1/records/cursor.json', 'POST', {
          app: appId,
          query: queryCondition,
          size: 500,
        });

        const result: kintone.types.SavedFields[] = [];
        try {
          while (true) {
            const resp = await kintone.api('/k/v1/records/cursor.json', 'GET', {
              id,
            });
            result.push(...resp.records);
            if (!resp.next) {
              break;
            }
          }
        } catch (e) {
          // カーソルを削除
          try {
            await kintone.api('/k/v1/records/cursor.json', 'DELETE', { id });
          } catch (deleteError) {
            console.error(deleteError);
          }
          throw e;
        }

        return result;
      },
    },
    queryCondition
  );
}
