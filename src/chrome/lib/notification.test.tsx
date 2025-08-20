import '@testing-library/jest-dom';
import { act } from '@testing-library/react';

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
      let result: { showToast: any; removeNotificationCenter: any };

      act(() => {
        result = setupNotificationCenter();
      });

      expect(result!).toHaveProperty('showToast');
      expect(result!).toHaveProperty('removeNotificationCenter');
      expect(typeof result!.showToast).toBe('function');
      expect(typeof result!.removeNotificationCenter).toBe('function');
    });

    it('DOM内に通知ルート要素を作成する', () => {
      act(() => {
        setupNotificationCenter();
      });

      const rootElement = document.getElementById(
        'kintone-auth-notification-root'
      );
      expect(rootElement).toBeInTheDocument();
    });

    it('removeNotificationCenterを呼ぶとDOM要素が削除される', () => {
      let removeNotificationCenter: () => void = () => {};

      act(() => {
        ({ removeNotificationCenter } = setupNotificationCenter());
      });

      const rootElement = document.getElementById(
        'kintone-auth-notification-root'
      );
      expect(rootElement).toBeInTheDocument();

      act(() => {
        removeNotificationCenter();
      });

      const removedElement = document.getElementById(
        'kintone-auth-notification-root'
      );
      expect(removedElement).not.toBeInTheDocument();
    });

    it('showToast関数が呼び出し可能である', () => {
      let showToast: (type: any, message: string) => void = () => {};

      act(() => {
        ({ showToast } = setupNotificationCenter());
      });

      // エラーなく呼び出せることを確認
      expect(() => showToast('info', 'テストメッセージ')).not.toThrow();
    });
  });
});
