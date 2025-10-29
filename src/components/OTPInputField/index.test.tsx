import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';

import { generateHOTP, generateTOTP } from '@lib/gen-otp';
import { decodeOTPAuthURI } from '@lib/otpauth-uri';

import OTPInputField from './index';

jest.mock('@lib/gen-otp', () => ({
  generateHOTP: jest.fn(),
  generateTOTP: jest.fn(),
  prettifyOTP: jest.fn((otp: string) => otp),
}));

jest.mock('@lib/otpauth-uri', () => ({
  decodeOTPAuthURI: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockGenerateHOTP = jest.mocked(generateHOTP);
const mockGenerateTOTP = jest.mocked(generateTOTP);
const mockDecodeOTPAuthURI = jest.mocked(decodeOTPAuthURI);

describe('OTPInputField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('displays TOTP code when value is provided', async () => {
    const totpURI =
      'otpauth://totp/Example:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example';
    const mockOnChange = jest.fn();
    const now = new Date();
    const availableUntil = new Date(now.getTime() + 30000);

    mockDecodeOTPAuthURI.mockReturnValue({
      type: 'TOTP',
      label: 'Test',
      issuer: 'Issuer',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: 'secret',
    } as any);

    mockGenerateTOTP.mockResolvedValue({
      type: 'TOTP' as const,
      otp: '123456',
      availableFrom: now,
      availableUntil,
      timestamp: now,
    });

    const view = render(
      <OTPInputField
        label="ワンタイムパスワード"
        value={totpURI}
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('123456')).toBeInTheDocument();
    });

    view.unmount();
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
