/**
 * URLを正規化する。クエリパラメータとハッシュを除去し、プロトコル、ホスト、パスのみを残す。
 *
 * @param url - 正規化するURL
 * @returns 正規化されたURL。無効なURLの場合は元の文字列を返す。
 */
export const normalizeURL = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
  } catch {
    return url;
  }
};

/**
 * HTML要素が入力フィールドかどうかを判定する。
 *
 * @param element - 判定するHTML要素
 * @returns 入力フィールドの場合は true、そうでなければ false
 */
export const isInputField = (element: HTMLElement): boolean => {
  if (element instanceof HTMLInputElement) {
    const type = element.type.toLowerCase();
    return ['text', 'email', 'password', 'username'].includes(type);
  }

  if (element instanceof HTMLTextAreaElement) {
    return true;
  }

  return element.isContentEditable;
};

/**
 * HTML要素のフィールドタイプを特定する。
 *
 * @param element - 判定するHTML要素
 * @returns フィールドタイプ（'username' | 'password' | 'email' | 'text' | null）
 */
export const getFieldType = (
  element: HTMLElement
): 'username' | 'password' | 'email' | 'text' | null => {
  if (element instanceof HTMLInputElement) {
    const type = element.type.toLowerCase();
    const name = element.name.toLowerCase();
    const id = element.id.toLowerCase();
    const placeholder = element.placeholder.toLowerCase();

    if (type === 'password') {
      return 'password';
    }

    if (
      type === 'email' ||
      name.includes('email') ||
      id.includes('email') ||
      placeholder.includes('email')
    ) {
      return 'email';
    }

    if (
      name.includes('user') ||
      name.includes('login') ||
      id.includes('user') ||
      id.includes('login') ||
      placeholder.includes('user') ||
      placeholder.includes('login')
    ) {
      return 'username';
    }

    return 'text';
  }

  return null;
};
