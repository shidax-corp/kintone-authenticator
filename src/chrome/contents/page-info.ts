/**
 * ページ情報を取得するためのユーティリティ関数
 */

/**
 * ページのサイト名を取得する
 * og:site_nameメタタグがある場合はそれを優先し、ない場合はdocument.titleを使用する
 * @returns サイト名
 */
export const getPageSiteName = (): string => {
  // og:site_nameメタタグを検索（property属性とname属性の両方をチェック）
  const ogSiteNameByProperty = document.querySelector(
    'meta[property="og:site_name"]'
  ) as HTMLMetaElement;
  const ogSiteNameByName = document.querySelector(
    'meta[name="og:site_name"]'
  ) as HTMLMetaElement;

  // og:site_nameが見つかった場合、その値を返す（property属性を優先）
  if (ogSiteNameByProperty?.content) {
    const trimmedContent = ogSiteNameByProperty.content.trim();
    if (trimmedContent) {
      return trimmedContent;
    }
  }

  if (ogSiteNameByName?.content) {
    const trimmedContent = ogSiteNameByName.content.trim();
    if (trimmedContent) {
      return trimmedContent;
    }
  }

  // og:site_nameが見つからない場合、document.titleを返す
  return document.title || '';
};
