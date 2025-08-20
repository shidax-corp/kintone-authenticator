/**
 * アクティブタブに関するユーティリティ関数
 */

/**
 * アクティブタブでページのサイト名を取得する
 * og:site_nameメタタグがある場合はそれを優先し、ない場合はdocument.titleを使用する
 * @returns サイト名
 */
export const getActiveTabSiteName = async (): Promise<string> => {
  try {
    // アクティブタブを取得
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];

    if (!activeTab || !activeTab.id) {
      return '';
    }

    // アクティブタブでgetPageSiteName相当の処理を実行
    const results = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: () => {
        // この関数はアクティブタブのコンテキストで実行される
        const getPageSiteName = (): string => {
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

        return getPageSiteName();
      },
    });

    if (results && results[0] && results[0].result) {
      return results[0].result;
    }

    // スクリプト実行に失敗した場合は、フォールバックとしてタブのタイトルを使用
    return activeTab.title || '';
  } catch {
    // エラーが発生した場合は、通常のタブ情報取得にフォールバック
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const activeTab = tabs[0];
      return activeTab?.title || '';
    } catch {
      return '';
    }
  }
};
