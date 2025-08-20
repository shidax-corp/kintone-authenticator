import React from 'react';

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import RegisterModal from './RegisterModal';

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

describe('RegisterModal', () => {
  const mockProps = {
    onClose: jest.fn(),
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

    render(<RegisterModal {...mockProps} />);

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

    render(<RegisterModal {...mockProps} />);

    const urlInput = await screen.findByDisplayValue(
      'https://accounts.google.com/'
    );

    expect(urlInput).toBeInTheDocument();
  });
});
