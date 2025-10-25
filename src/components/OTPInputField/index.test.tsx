import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import OTPInputField from './index';

describe('OTPInputField', () => {
  it('displays OTPField when value is provided', () => {
    const totpURI =
      'otpauth://totp/Example:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example';
    const mockOnChange = jest.fn();

    const { container } = render(
      <OTPInputField
        label="ワンタイムパスワード"
        value={totpURI}
        onChange={mockOnChange}
      />
    );

    // OTPFieldコンポーネントが表示されていることを確認
    expect(container.querySelector('.otp-field')).toBeInTheDocument();
  });

  it('displays "未設定" when no value is provided', () => {
    const mockOnChange = jest.fn();

    render(
      <OTPInputField
        label="ワンタイムパスワード"
        value=""
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('未設定')).toBeInTheDocument();
  });

  it('renders scanner and file reader buttons', () => {
    const mockOnChange = jest.fn();

    render(
      <OTPInputField
        label="ワンタイムパスワード"
        value=""
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('スキャン')).toBeInTheDocument();
    expect(screen.getByText('参照')).toBeInTheDocument();
  });

  it('does not render scanner button when disableCamera is true', () => {
    const mockOnChange = jest.fn();

    render(
      <OTPInputField
        label="ワンタイムパスワード"
        value=""
        onChange={mockOnChange}
        disableCamera={true}
      />
    );

    expect(screen.queryByText('スキャン')).not.toBeInTheDocument();
    expect(screen.getByText('参照')).toBeInTheDocument();
  });
});
