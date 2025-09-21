/**
 * kintone アプリURLのパース機能
 */

export interface ParsedKintoneUrl {
  kintoneBaseUrl: string;
  kintoneAppId: string;
}

/**
 * kintone アプリURLをパースしてドメインとアプリIDを抽出する
 * @param appUrl kintone アプリURL (例: "https://example.cybozu.com/k/123/")
 * @returns パースされたドメインとアプリID
 * @throws URL が無効な場合はエラーをスロー
 */
export const parseKintoneAppUrl = (appUrl: string): ParsedKintoneUrl => {
  if (!appUrl.trim()) {
    throw new Error('アプリURLが入力されていません');
  }

  let url: URL;
  try {
    url = new URL(appUrl.trim());
  } catch {
    throw new Error('有効なURLを入力してください');
  }

  // HTTPSのみ許可
  if (url.protocol !== 'https:') {
    throw new Error('HTTPSのURLを入力してください');
  }

  // kintone の /k/{appId}/ パターンをチェック
  const pathMatch = url.pathname.match(/^\/k\/(\d+)\/?$/);
  if (!pathMatch) {
    throw new Error(
      'kintone アプリのURLを入力してください (例: https://example.cybozu.com/k/123/)'
    );
  }

  const appId = pathMatch[1];
  const domain = url.origin;

  return {
    kintoneBaseUrl: domain,
    kintoneAppId: appId,
  };
};

/**
 * kintone アプリURLが有効かどうかをチェックする
 * @param appUrl チェックするURL
 * @returns 有効な場合は true
 */
export const isValidKintoneAppUrl = (appUrl: string): boolean => {
  try {
    parseKintoneAppUrl(appUrl);
    return true;
  } catch {
    return false;
  }
};
