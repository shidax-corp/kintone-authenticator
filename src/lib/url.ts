/**
 * 有効なURLかどうかをチェックする。
 *
 * @param url - チェックするURL文字列
 * @return 有効なURLならtrue、無効な場合はfalse
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 有効なURLパターン（ワイルドカードを含む）かどうかをチェックする。
 *
 * @param url - チェックするURL文字列
 * @return 有効なURLパターンならtrue、無効な場合はfalse
 */
export function isValidURLPattern(url: string): boolean {
  if (!url.match(/^https?:\/\//)) {
    url = 'https://' + url;
  }

  url = url.replace(/\*/g, 'wildcard');
  return isValidURL(url);
}

/**
 * URLからオリジン（プロトコル + ドメイン + 末尾のスラッシュ）を抽出する。
 *
 * @param url - 完全なURL文字列
 * @return オリジンURL（例: https://github.com/）。無効なURLの場合は元のURLを返す
 */
export function extractOriginURL(url: string | undefined): string {
  if (!url) {
    return '';
  }
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}/`;
  } catch {
    return url;
  }
}
