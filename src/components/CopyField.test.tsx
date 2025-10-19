import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import CopyField from './CopyField';

// navigator.clipboard のモック
const mockClipboard = {
  writeText: jest.fn(),
};

Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: mockClipboard,
});

describe('CopyField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('コピー成功時に「コピーしました」メッセージが表示される', async () => {
    mockClipboard.writeText.mockResolvedValue(undefined);

    render(
      <CopyField value="test-value">
        <span>Test Content</span>
      </CopyField>
    );

    const field = screen.getByText('Test Content').parentElement;
    if (field) {
      fireEvent.click(field);
    }

    await waitFor(() => {
      const message = screen.getByText('コピーしました');
      expect(message).toBeVisible();
    });
  });

  test('コピー失敗時に「コピーしました」メッセージが表示されない', async () => {
    mockClipboard.writeText.mockRejectedValue(
      new Error('Clipboard write failed')
    );

    render(
      <CopyField value="test-value">
        <span>Test Content</span>
      </CopyField>
    );

    const field = screen.getByText('Test Content').parentElement;
    if (field) {
      fireEvent.click(field);
    }

    // メッセージが表示されないことを確認
    await waitFor(
      () => {
        const message = screen.queryByText('コピーしました');
        expect(message).toBeNull();
      },
      { timeout: 1000 }
    );
  });

  test('valueが未設定の場合はクリックしても何も起こらない', () => {
    render(
      <CopyField>
        <span>Test Content</span>
      </CopyField>
    );

    const field = screen.getByText('Test Content').parentElement;
    if (field) {
      fireEvent.click(field);
    }

    expect(mockClipboard.writeText).not.toHaveBeenCalled();
  });
});
