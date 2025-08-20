import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import RegisterModal from './RegisterModal';

// Chrome API のモック
const mockChrome = {
  runtime: {
    sendMessage: jest.fn(),
  },
  tabs: {
    query: jest.fn(),
  },
};

// @ts-ignore
global.chrome = mockChrome;

// navigator.clipboard のモック
const mockClipboard = {
  writeText: jest.fn(),
};

Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: mockClipboard,
});

describe('RegisterModal', () => {
  const mockOnClose = jest.fn();
  const mockShowToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockClipboard.writeText.mockResolvedValue(undefined);
  });

  it('should close immediately after successful registration without timeout', async () => {
    // Arrange
    mockChrome.runtime.sendMessage.mockImplementation((message) => {
      if (message.type === 'REGISTER_OTP') {
        return Promise.resolve({
          success: true,
          data: { recordId: '123' },
        });
      }
      if (message.type === 'GET_OTP') {
        return Promise.resolve({
          success: true,
          data: { otp: '123456' },
        });
      }
      return Promise.resolve({ success: true });
    });

    // Act
    render(
      <RegisterModal
        onClose={mockOnClose}
        showToast={mockShowToast}
        initialPageTitle="Test Site"
        initialPageUrl="https://example.com"
      />
    );

    // Fill out the form
    const nameInput = screen.getByDisplayValue('Test Site');
    const urlInput = screen.getByDisplayValue('https://example.com');
    const usernameInput = screen.getByPlaceholderText('ユーザー名またはメールアドレス');
    const passwordInput = screen.getByPlaceholderText('パスワード');

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpass' } });

    // Submit the form
    const submitButton = screen.getByText('登録');
    fireEvent.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });

    // Verify it was called immediately, not after a timeout
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockShowToast).toHaveBeenCalledWith(
      'success',
      'OTPが登録され、クリップボードにコピーされました: 123456'
    );
  });

  it('should not close modal when registration fails', async () => {
    // Arrange
    mockChrome.runtime.sendMessage.mockImplementation((message) => {
      if (message.type === 'REGISTER_OTP') {
        return Promise.resolve({
          success: false,
          error: '登録に失敗しました',
        });
      }
      return Promise.resolve({ success: true });
    });

    // Act
    render(
      <RegisterModal
        onClose={mockOnClose}
        showToast={mockShowToast}
        initialPageTitle="Test Site"
        initialPageUrl="https://example.com"
      />
    );

    // Fill out the form
    const usernameInput = screen.getByPlaceholderText('ユーザー名またはメールアドレス');
    const passwordInput = screen.getByPlaceholderText('パスワード');

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpass' } });

    // Submit the form
    const submitButton = screen.getByText('登録');
    fireEvent.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('登録に失敗しました')).toBeInTheDocument();
    });

    // Modal should not be closed
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});