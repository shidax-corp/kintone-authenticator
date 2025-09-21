import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { RegisterForm } from './RegisterForm';

// Mock chrome API
const mockChromeTabsQuery = jest.fn();
Object.assign(global, {
  chrome: {
    tabs: {
      query: mockChromeTabsQuery,
    },
    runtime: {
      sendMessage: jest.fn(),
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
});
