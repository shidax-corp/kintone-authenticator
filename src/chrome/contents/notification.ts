export type NotificationType = 'success' | 'error' | 'info';

interface ActiveToast {
  element: HTMLElement;
  timeoutId: number;
}

/**
 * 通知センターをセットアップする関数
 * DOM内に通知を表示するための要素がマウントされる
 * @returns showToast関数とremoveNotificationCenter関数を含むオブジェクト
 */
export default function setupNotificationCenter(): {
  showToast: (type: NotificationType, message: string) => void;
  removeNotificationCenter: () => void;
} {
  // ローカル変数として管理
  let container: HTMLElement | null = null;
  const activeToasts: Map<string, ActiveToast> = new Map();

  const getTypeColor = (type: NotificationType): string => {
    const colors = {
      success: '#4caf50',
      error: '#f44336',
      info: '#2196f3',
    };
    return colors[type];
  };

  const removeToast = (id: string): void => {
    const toast = activeToasts.get(id);
    if (toast) {
      window.clearTimeout(toast.timeoutId);
      if (toast.element.parentNode) {
        toast.element.parentNode.removeChild(toast.element);
      }
      activeToasts.delete(id);
    }
  };

  const showToast = (type: NotificationType, message: string): void => {
    if (!container) {
      console.warn('Notification center is not initialized');
      return;
    }

    const id = `notification-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const element = document.createElement('div');

    element.id = id;
    element.textContent = message;
    element.style.cssText = `
      padding: 12px 24px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 300px;
      word-wrap: break-word;
      color: white;
      cursor: pointer;
      margin-bottom: 8px;
      transition: opacity 0.3s ease;
      background: ${getTypeColor(type)};
      pointer-events: auto;
    `;

    element.addEventListener('click', () => removeToast(id));
    element.addEventListener('mouseenter', () => {
      element.style.opacity = '0.9';
    });
    element.addEventListener('mouseleave', () => {
      element.style.opacity = '1';
    });

    container.appendChild(element);

    const timeoutId = window.setTimeout(() => removeToast(id), 3000);
    activeToasts.set(id, { element, timeoutId });
  };

  // 通知用のコンテナ要素を作成
  container = document.createElement('div');
  container.id = 'kintone-auth-notification-root';
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    pointer-events: none;
  `;

  document.body.appendChild(container);

  const removeNotificationCenter = (): void => {
    // 全てのtoastを削除
    activeToasts.forEach((toast) => {
      window.clearTimeout(toast.timeoutId);
    });
    activeToasts.clear();

    // コンテナを削除
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
      container = null;
    }
  };

  return {
    showToast,
    removeNotificationCenter,
  };
}
