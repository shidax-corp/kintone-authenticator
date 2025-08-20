import React from 'react';

import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

import {
  NotificationCenter,
  NotificationProvider,
  type NotificationType,
  setGlobalShowToast,
  showToast,
  useNotification,
} from './notification';

// テスト用のコンポーネント
const TestComponent: React.FC<{
  onShowToast?: (type: NotificationType, message: string) => void;
}> = ({ onShowToast }) => {
  const { showToast: contextShowToast } = useNotification();

  React.useEffect(() => {
    if (onShowToast) {
      onShowToast('success', 'テストメッセージ');
    }
  }, [onShowToast]);

  return (
    <div>
      <button onClick={() => contextShowToast('success', '成功メッセージ')}>
        成功トースト
      </button>
      <button onClick={() => contextShowToast('error', 'エラーメッセージ')}>
        エラートースト
      </button>
      <button onClick={() => contextShowToast('info', '情報メッセージ')}>
        情報トースト
      </button>
      <NotificationCenter />
    </div>
  );
};

describe('notification system', () => {
  beforeEach(() => {
    // タイマーをモックする
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('NotificationProvider', () => {
    it('子コンポーネントにコンテキストを提供する', () => {
      const TestChild = () => {
        const { notifications } = useNotification();
        return (
          <div data-testid="notifications-count">{notifications.length}</div>
        );
      };

      render(
        <NotificationProvider>
          <TestChild />
        </NotificationProvider>
      );

      expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
    });

    it('プロバイダー外でuseNotificationを使用するとエラーになる', () => {
      const TestChild = () => {
        useNotification();
        return <div>テスト</div>;
      };

      // エラーログを抑制
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => render(<TestChild />)).toThrow(
        'useNotification must be used within a NotificationProvider'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('showToast', () => {
    it('成功メッセージを表示する', () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      fireEvent.click(screen.getByText('成功トースト'));

      expect(screen.getByText('成功メッセージ')).toBeInTheDocument();
      expect(
        screen.getByText('成功メッセージ').closest('.notification')
      ).toHaveClass('success');
    });

    it('エラーメッセージを表示する', () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      fireEvent.click(screen.getByText('エラートースト'));

      expect(screen.getByText('エラーメッセージ')).toBeInTheDocument();
      expect(
        screen.getByText('エラーメッセージ').closest('.notification')
      ).toHaveClass('error');
    });

    it('情報メッセージを表示する', () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      fireEvent.click(screen.getByText('情報トースト'));

      expect(screen.getByText('情報メッセージ')).toBeInTheDocument();
      expect(
        screen.getByText('情報メッセージ').closest('.notification')
      ).toHaveClass('info');
    });

    it('複数の通知を同時に表示できる', () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      fireEvent.click(screen.getByText('成功トースト'));
      fireEvent.click(screen.getByText('エラートースト'));
      fireEvent.click(screen.getByText('情報トースト'));

      expect(screen.getByText('成功メッセージ')).toBeInTheDocument();
      expect(screen.getByText('エラーメッセージ')).toBeInTheDocument();
      expect(screen.getByText('情報メッセージ')).toBeInTheDocument();
    });

    it('3秒後に自動で通知が削除される', () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      fireEvent.click(screen.getByText('成功トースト'));
      expect(screen.getByText('成功メッセージ')).toBeInTheDocument();

      // 3秒後
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(screen.queryByText('成功メッセージ')).not.toBeInTheDocument();
    });

    it('通知をクリックすると手動で削除できる', () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      fireEvent.click(screen.getByText('成功トースト'));
      const notification = screen.getByText('成功メッセージ');

      fireEvent.click(notification);

      expect(screen.queryByText('成功メッセージ')).not.toBeInTheDocument();
    });
  });

  describe('NotificationCenter', () => {
    it('通知がない場合は何も表示しない', () => {
      const { container } = render(
        <NotificationProvider>
          <NotificationCenter />
        </NotificationProvider>
      );

      expect(container.firstChild).toBeNull();
    });

    it('カスタムクラス名を適用できる', () => {
      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      fireEvent.click(screen.getByText('成功トースト'));

      const notificationCenter = screen
        .getByText('成功メッセージ')
        .closest('.notification-center');
      expect(notificationCenter).toBeInTheDocument();
    });
  });

  describe('グローバルshowToast関数', () => {
    it('プロバイダー外でsetGlobalShowToastが設定されていない場合は警告を出す', () => {
      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      showToast('info', 'テストメッセージ');

      expect(consoleSpy).toHaveBeenCalledWith(
        'showToast called before NotificationProvider is ready'
      );

      consoleSpy.mockRestore();
    });

    it('setGlobalShowToastが設定されている場合は正常に動作する', () => {
      const mockShowToast = jest.fn();
      setGlobalShowToast(mockShowToast);

      showToast('success', 'グローバルテスト');

      expect(mockShowToast).toHaveBeenCalledWith('success', 'グローバルテスト');
    });
  });
});
