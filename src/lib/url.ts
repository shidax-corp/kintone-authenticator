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
