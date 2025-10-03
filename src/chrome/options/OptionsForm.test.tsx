import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { OptionsForm } from './OptionsForm';

// Mock chrome.runtime.sendMessage
const mockSendMessage = jest.fn();
global.chrome = {
  runtime: {
    sendMessage: mockSendMessage,
  },
} as never;

// Mock storage functions
jest.mock('../lib/storage', () => ({
  getSettings: jest.fn(() => Promise.resolve(null)),
  saveSettings: jest.fn(() => Promise.resolve()),
  isSettingsComplete: jest.fn((settings) => {
    return !!(
      settings.kintoneBaseUrl &&
      settings.kintoneAppId &&
      settings.kintoneUsername &&
      settings.kintonePassword
    );
  }),
}));

describe('OptionsForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('誤ったURLを入力したときにエラーメッセージを表示する', async () => {
    render(<OptionsForm />);

    await waitFor(() => {
      expect(screen.queryByText('設定を読み込み中...')).not.toBeInTheDocument();
    });

    const urlInput = screen.getByPlaceholderText(
      'https://example.cybozu.com/k/123/'
    );

    // 無効なURLを入力
    fireEvent.change(urlInput, { target: { value: 'invalid-url' } });

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(
        screen.getByText('有効なURLを入力してください')
      ).toBeInTheDocument();
    });
  });

  it('HTTPのURLを入力したときにエラーメッセージを表示する', async () => {
    render(<OptionsForm />);

    await waitFor(() => {
      expect(screen.queryByText('設定を読み込み中...')).not.toBeInTheDocument();
    });

    const urlInput = screen.getByPlaceholderText(
      'https://example.cybozu.com/k/123/'
    );

    // HTTPのURLを入力
    fireEvent.change(urlInput, {
      target: { value: 'http://example.cybozu.com/k/123/' },
    });

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(
        screen.getByText('HTTPSのURLを入力してください')
      ).toBeInTheDocument();
    });
  });

  it('kintoneアプリでないURLを入力したときにエラーメッセージを表示する', async () => {
    render(<OptionsForm />);

    await waitFor(() => {
      expect(screen.queryByText('設定を読み込み中...')).not.toBeInTheDocument();
    });

    const urlInput = screen.getByPlaceholderText(
      'https://example.cybozu.com/k/123/'
    );

    // kintoneアプリでないURLを入力
    fireEvent.change(urlInput, {
      target: { value: 'https://example.com/path' },
    });

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(
        screen.getByText(/kintone アプリのURLを入力してください/)
      ).toBeInTheDocument();
    });
  });

  it('正しいURLを入力したときにエラーメッセージが表示されない', async () => {
    render(<OptionsForm />);

    await waitFor(() => {
      expect(screen.queryByText('設定を読み込み中...')).not.toBeInTheDocument();
    });

    const urlInput = screen.getByPlaceholderText(
      'https://example.cybozu.com/k/123/'
    );

    // 正しいURLを入力
    fireEvent.change(urlInput, {
      target: { value: 'https://example.cybozu.com/k/123/' },
    });

    // エラーメッセージが表示されないことを確認
    await waitFor(() => {
      expect(
        screen.queryByText('有効なURLを入力してください')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('HTTPSのURLを入力してください')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/kintone アプリのURLを入力してください/)
      ).not.toBeInTheDocument();
    });
  });

  it('URLを空にしたときにエラーメッセージが表示されない', async () => {
    render(<OptionsForm />);

    await waitFor(() => {
      expect(screen.queryByText('設定を読み込み中...')).not.toBeInTheDocument();
    });

    const urlInput = screen.getByPlaceholderText(
      'https://example.cybozu.com/k/123/'
    );

    // まず無効なURLを入力してエラーを表示させる
    fireEvent.change(urlInput, { target: { value: 'invalid-url' } });

    await waitFor(() => {
      expect(
        screen.getByText('有効なURLを入力してください')
      ).toBeInTheDocument();
    });

    // URLを空にする
    fireEvent.change(urlInput, { target: { value: '' } });

    // エラーメッセージが消えることを確認
    await waitFor(() => {
      expect(
        screen.queryByText('有効なURLを入力してください')
      ).not.toBeInTheDocument();
    });
  });
});
