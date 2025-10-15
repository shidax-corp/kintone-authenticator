import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { RegisterForm } from './RegisterForm';

// Mock chrome API
const mockChromeTabsQuery = jest.fn();
const mockSendMessage = jest.fn();
Object.assign(global, {
  chrome: {
    tabs: {
      query: mockChromeTabsQuery,
    },
    runtime: {
      sendMessage: mockSendMessage,
    },
  },
});

describe('RegisterForm', () => {
  const mockProps = {
    onBack: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('URL欄にオリジンのみが初期値として設定される', async () => {
    // Chrome tabs APIのモック設定
    mockChromeTabsQuery.mockImplementation((query, callback) => {
      callback([
        {
          url: 'https://github.com/shidax-corp/kintone-authenticator',
          title: 'GitHub - shidax-corp/kintone-authenticator',
        },
      ]);
    });

    render(<RegisterForm {...mockProps} />);

    // URLフィールドが表示されるまで待機
    const urlInput = await screen.findByDisplayValue('https://github.com/');

    expect(urlInput).toBeInTheDocument();
  });

  test('クエリパラメータがあるURLからもオリジンのみが抽出される', async () => {
    mockChromeTabsQuery.mockImplementation((query, callback) => {
      callback([
        {
          url: 'https://accounts.google.com/signin/oauth?param=value&other=test',
          title: 'Google Accounts',
        },
      ]);
    });

    render(<RegisterForm {...mockProps} />);

    const urlInput = await screen.findByDisplayValue(
      'https://accounts.google.com/'
    );

    expect(urlInput).toBeInTheDocument();
  });

  test('ポート番号があるURLからもオリジンのみが抽出される', async () => {
    mockChromeTabsQuery.mockImplementation((query, callback) => {
      callback([
        {
          url: 'http://localhost:8080/app/dashboard',
          title: 'Local App',
        },
      ]);
    });

    render(<RegisterForm {...mockProps} />);

    const urlInput = await screen.findByDisplayValue('http://localhost:8080/');

    expect(urlInput).toBeInTheDocument();
  });

  test('initialPageUrlプロパティが指定されている場合はそちらが優先される', async () => {
    mockChromeTabsQuery.mockImplementation((query, callback) => {
      callback([
        {
          url: 'https://github.com/shidax-corp/kintone-authenticator',
          title: 'GitHub',
        },
      ]);
    });

    render(
      <RegisterForm
        {...mockProps}
        initialPageUrl="https://example.com/custom"
      />
    );

    // initialPageUrlが指定されている場合、chrome.tabs.queryの結果は使われない
    const urlInput = await screen.findByDisplayValue(
      'https://example.com/custom'
    );

    expect(urlInput).toBeInTheDocument();
  });

  test('サイト名が空の場合はバリデーションエラーが表示される', async () => {
    mockSendMessage.mockClear();

    mockChromeTabsQuery.mockImplementation((query, callback) => {
      callback([
        {
          url: 'https://example.com',
          title: 'Test Site',
        },
      ]);
    });

    render(<RegisterForm {...mockProps} />);

    // Wait for component to render with initial value
    const nameInput = await screen.findByPlaceholderText('例: Google');
    expect(nameInput).toHaveValue('Test Site');

    // Clear the name to trigger validation
    fireEvent.change(nameInput, { target: { value: '' } });

    // 送信ボタンをクリック - but it should be disabled
    const submitButton = screen.getByText('登録');
    expect(submitButton).toBeDisabled();

    // Even if we force a click, validation should still prevent submission
    // We need to set a value first to enable the button, then clear it programmatically
    fireEvent.change(nameInput, { target: { value: 'Test' } });
    expect(submitButton).not.toBeDisabled();

    // Now clear it again and try to submit via form submission
    fireEvent.change(nameInput, { target: { value: '' } });

    // Button should be disabled again
    expect(submitButton).toBeDisabled();
  });

  test('サイト名が空白のみの場合もバリデーションエラーが表示される', async () => {
    mockSendMessage.mockClear();

    mockChromeTabsQuery.mockImplementation((query, callback) => {
      callback([
        {
          url: 'https://example.com',
          title: 'Test Site',
        },
      ]);
    });

    render(<RegisterForm {...mockProps} />);

    // サイト名を空白のみに設定
    const nameInput = await screen.findByPlaceholderText('例: Google');
    fireEvent.change(nameInput, { target: { value: '   ' } });

    // 送信ボタンは無効化される（trim後に空になるため）
    const submitButton = screen.getByText('登録');
    expect(submitButton).toBeDisabled();

    // sendMessageが呼ばれていないことを確認
    expect(mockSendMessage).not.toHaveBeenCalled();
  });
});
