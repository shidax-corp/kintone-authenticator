import '@testing-library/jest-dom';

import setupNotificationCenter from './notification';

describe('notification system', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('setupNotificationCenter', () => {
    it('showToast関数とremoveNotificationCenter関数を返す', () => {
      const result = setupNotificationCenter();

      expect(result).toHaveProperty('showToast');
      expect(result).toHaveProperty('removeNotificationCenter');
      expect(typeof result.showToast).toBe('function');
      expect(typeof result.removeNotificationCenter).toBe('function');
    });

    it('DOM内に通知ルート要素を作成する', () => {
      setupNotificationCenter();

      const rootElement = document.getElementById(
        'kintone-auth-notification-root'
      );
      expect(rootElement).toBeInTheDocument();
    });

    it('removeNotificationCenterを呼ぶとDOM要素が削除される', () => {
      const { removeNotificationCenter } = setupNotificationCenter();

      const rootElement = document.getElementById(
        'kintone-auth-notification-root'
      );
      expect(rootElement).toBeInTheDocument();

      removeNotificationCenter();

      const removedElement = document.getElementById(
        'kintone-auth-notification-root'
      );
      expect(removedElement).not.toBeInTheDocument();
    });

    it('showToast関数でDOM要素が作成される', () => {
      const { showToast } = setupNotificationCenter();

      showToast('success', 'テストメッセージ');

      const container = document.getElementById(
        'kintone-auth-notification-root'
      );
      expect(container).toBeInTheDocument();
      expect(container!.children.length).toBe(1);

      const notification = container!.children[0] as HTMLElement;
      expect(notification.textContent).toBe('テストメッセージ');
      expect(notification.style.background).toBe('rgb(76, 175, 80)'); // #4caf50
    });

    it('複数の通知を同時に表示できる', () => {
      const { showToast } = setupNotificationCenter();

      showToast('success', '成功メッセージ');
      showToast('error', 'エラーメッセージ');
      showToast('info', '情報メッセージ');

      const container = document.getElementById(
        'kintone-auth-notification-root'
      );
      expect(container!.children.length).toBe(3);
    });

    it('通知の種類により背景色が変わる', () => {
      const { showToast } = setupNotificationCenter();

      showToast('success', '成功');
      showToast('error', 'エラー');
      showToast('info', '情報');

      const container = document.getElementById(
        'kintone-auth-notification-root'
      );
      const notifications = Array.from(container!.children) as HTMLElement[];

      expect(notifications[0].style.background).toBe('rgb(76, 175, 80)'); // success: #4caf50
      expect(notifications[1].style.background).toBe('rgb(244, 67, 54)'); // error: #f44336
      expect(notifications[2].style.background).toBe('rgb(33, 150, 243)'); // info: #2196f3
    });

    it('通知をクリックすると削除される', () => {
      const { showToast } = setupNotificationCenter();

      showToast('info', 'クリックテスト');

      const container = document.getElementById(
        'kintone-auth-notification-root'
      );
      const notification = container!.children[0] as HTMLElement;

      expect(container!.children.length).toBe(1);

      // クリックイベントを発火
      notification.click();

      expect(container!.children.length).toBe(0);
    });

    it('通知は3秒後に自動削除される', () => {
      const { showToast } = setupNotificationCenter();

      showToast('info', '自動削除テスト');

      const container = document.getElementById(
        'kintone-auth-notification-root'
      );
      expect(container!.children.length).toBe(1);

      // 3秒進める
      jest.advanceTimersByTime(3000);

      expect(container!.children.length).toBe(0);
    });

    it('未初期化状態でshowToastを呼ぶと警告が出る', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // setupNotificationCenter を呼ばずに直接 showToast を呼ぶことはできないため、
      // 削除後に呼び出すシナリオをテスト
      const { showToast, removeNotificationCenter } = setupNotificationCenter();
      removeNotificationCenter();

      showToast('info', 'テスト');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Notification center is not initialized'
      );

      consoleSpy.mockRestore();
    });
  });
});
