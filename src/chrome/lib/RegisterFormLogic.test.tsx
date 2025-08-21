import React from 'react';

import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { RegisterFormLogic } from './RegisterFormLogic';

describe('RegisterFormLogic', () => {
  const mockOnSubmit = jest.fn();
  const mockGetTabInfo = jest.fn();

  const renderComponent = (props = {}) => {
    const defaultProps = {
      onSubmit: mockOnSubmit,
      getTabInfo: mockGetTabInfo,
      ...props,
    };

    return render(
      <RegisterFormLogic {...defaultProps}>
        {({
          loading,
          error,
          handleSubmit,
          isFormValid,
          formFields,
        }) => (
          <form onSubmit={handleSubmit}>
            {error && <div data-testid="error">{error}</div>}
            {formFields}
            <button type="submit" disabled={!isFormValid || loading}>
              {loading ? '登録中...' : '登録'}
            </button>
          </form>
        )}
      </RegisterFormLogic>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTabInfo.mockResolvedValue({
      name: 'Test Site',
      url: 'https://example.com/',
    });
  });

  test('初期値が正しく設定される', async () => {
    renderComponent({
      initialPageTitle: 'Initial Title',
      initialPageUrl: 'https://initial.com/',
    });

    // Wait for initial values to be loaded
    await waitFor(() => {
      expect(screen.getByDisplayValue('Initial Title')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://initial.com/')).toBeInTheDocument();
    });
  });

  test('getTabInfoが呼び出されてフォームが更新される', async () => {
    renderComponent();

    await waitFor(() => {
      expect(mockGetTabInfo).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Site')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://example.com/')).toBeInTheDocument();
    });
  });

  test('フォームフィールドが正しく表示される', () => {
    renderComponent();

    expect(screen.getByPlaceholderText('例: Google')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('例: https://accounts.google.com/*')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ユーザー名またはメールアドレス')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('パスワード')).toBeInTheDocument();
  });

  test('入力値の変更が正しく処理される', async () => {
    renderComponent();

    const nameInput = screen.getByPlaceholderText('例: Google');
    fireEvent.change(nameInput, { target: { value: 'New Site Name' } });

    await waitFor(() => {
      expect(screen.getByDisplayValue('New Site Name')).toBeInTheDocument();
    });
  });

  test('必須フィールドのバリデーションが動作する', async () => {
    renderComponent({
      getTabInfo: undefined, // Don't auto-fill form data for this test
    });

    const submitButton = screen.getByRole('button', { name: '登録' });
    expect(submitButton).toBeDisabled(); // Form should be invalid and button disabled

    // Click should not call onSubmit when form is invalid
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  test('バリデーション通過時にonSubmitが呼び出される', async () => {
    renderComponent();

    // Wait for tab info to load first
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Site')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: '登録' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Site',
        url: 'https://example.com/',
        username: '',
        password: '',
        otpAuthUri: '',
      });
    });
  });

  test('onSubmitエラー時にエラーメッセージが表示される', async () => {
    const errorMessage = 'Registration failed';
    mockOnSubmit.mockRejectedValue(new Error(errorMessage));

    renderComponent();

    // Wait for tab info to load first
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Site')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: '登録' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
    });
  });

  test('ローディング状態が正しく処理される', async () => {
    let resolveSubmit: () => void;
    const submitPromise = new Promise<void>((resolve) => {
      resolveSubmit = resolve;
    });
    mockOnSubmit.mockReturnValue(submitPromise);

    renderComponent();

    // Wait for tab info to load first
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Site')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: '登録' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('登録中...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '登録中...' })).toBeDisabled();
    });

    resolveSubmit!();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '登録' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '登録' })).not.toBeDisabled();
    });
  });

  test('getTabInfoなしでも動作する', async () => {
    renderComponent({
      getTabInfo: undefined,
      initialPageTitle: 'Manual Title',
      initialPageUrl: 'https://manual.com/',
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Manual Title')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://manual.com/')).toBeInTheDocument();
    });
  });
});