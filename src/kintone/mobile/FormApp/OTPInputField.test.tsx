import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import OTPInputField from './OTPInputField';

// Mock OTPField component
jest.mock('@components/OTPField', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="otp-field">OTP Field Mock</div>),
}));

// Mock Scanner component
jest.mock('./Scanner', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="scanner">Scanner Mock</div>),
}));

describe('OTPInputField - ViewpanelConqueror resilience', () => {
  const mockOnScanned = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Clean up DOM
    document.body.innerHTML = '';
  });

  it('should not throw error when kintone native elements are missing', () => {
    // レンダリング時にkintoneネイティブ要素が存在しない状態をテスト
    expect(() => {
      render(
        <OTPInputField uri="" onScanned={mockOnScanned} openScannerByDefault />
      );
    }).not.toThrow();
  });

  it('should render without errors when DOM elements are not found', () => {
    render(<OTPInputField uri="" onScanned={mockOnScanned} />);

    // コンポーネントが正常にレンダリングされることを確認
    expect(screen.getByTestId('otp-field')).toBeInTheDocument();
  });

  it('should handle scanner button click without errors when elements are missing', () => {
    render(<OTPInputField uri="" onScanned={mockOnScanned} />);

    const scannerButton = screen.getByRole('button');

    // ボタンクリック時にエラーが発生しないことを確認
    expect(() => fireEvent.click(scannerButton)).not.toThrow();

    // スキャナーが表示されることを確認
    expect(screen.getByTestId('scanner')).toBeInTheDocument();
  });

  it('should work correctly when kintone native elements exist', () => {
    // kintoneネイティブ要素をモック
    const leftArea = document.createElement('div');
    leftArea.className = 'gaia-mobile-v2-app-record-edittoolbar-left';
    document.body.appendChild(leftArea);

    const cancelButton = document.createElement('button');
    cancelButton.className = 'gaia-mobile-v2-app-record-edittoolbar-cancel';
    document.body.appendChild(cancelButton);

    const saveButton = document.createElement('button');
    saveButton.className = 'gaia-mobile-v2-app-record-edittoolbar-save';
    document.body.appendChild(saveButton);

    // 要素が存在する場合も正常に動作することを確認
    expect(() => {
      render(
        <OTPInputField uri="" onScanned={mockOnScanned} openScannerByDefault />
      );
    }).not.toThrow();

    // 保存ボタンが非表示になっていることを確認
    expect(saveButton.style.display).toBe('none');
  });

  it('should not crash when hideSaveButton is called without save button', () => {
    render(
      <OTPInputField uri="" onScanned={mockOnScanned} openScannerByDefault />
    );

    // コンポーネントが正常にレンダリングされ、エラーが発生しないことを確認
    expect(screen.getByTestId('scanner')).toBeInTheDocument();
  });

  it('should ignore elements with wrong types (instanceof check)', () => {
    // 想定外の要素タイプをモック（例: divがbuttonのクラス名を持っている場合）
    const wrongTypeLeftArea = document.createElement('span'); // HTMLDivElementではない
    wrongTypeLeftArea.className = 'gaia-mobile-v2-app-record-edittoolbar-left';
    document.body.appendChild(wrongTypeLeftArea);

    const wrongTypeCancelButton = document.createElement('div'); // HTMLButtonElementではない
    wrongTypeCancelButton.className =
      'gaia-mobile-v2-app-record-edittoolbar-cancel';
    document.body.appendChild(wrongTypeCancelButton);

    const wrongTypeSaveButton = document.createElement('div'); // HTMLButtonElementではない
    wrongTypeSaveButton.className =
      'gaia-mobile-v2-app-record-edittoolbar-save';
    document.body.appendChild(wrongTypeSaveButton);

    // 要素が存在するが型が違う場合、エラーが発生しないことを確認
    expect(() => {
      render(
        <OTPInputField uri="" onScanned={mockOnScanned} openScannerByDefault />
      );
    }).not.toThrow();

    // 間違った型の要素は操作されないことを確認（displayは変更されていない）
    expect(wrongTypeSaveButton.style.display).toBe('');
  });
});
