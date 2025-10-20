import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';

import { generateTOTP } from '@lib/gen-otp';
import { decodeOTPAuthURI } from '@lib/otpauth-uri';

import OTPField from './OTPField';

jest.mock('@lib/gen-otp', () => ({
  generateHOTP: jest.fn(),
  generateTOTP: jest.fn(),
  prettifyOTP: jest.fn((otp: string) => otp),
}));

jest.mock('@lib/otpauth-uri', () => ({
  decodeOTPAuthURI: jest.fn(),
  encodeOTPAuthURI: jest.fn(),
}));

const mockGenerateTOTP = jest.mocked(generateTOTP);
const mockDecodeOTPAuthURI = jest.mocked(decodeOTPAuthURI);

describe('OTPField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders generated TOTP when URI can be decoded', async () => {
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

    const totpResult = {
      type: 'TOTP' as const,
      otp: '123456',
      availableFrom: now,
      availableUntil,
      timestamp: now,
    };

    mockGenerateTOTP.mockResolvedValue(totpResult);

    const view = render(
      <OTPField
        uri="otpauth://totp/Issuer:Test?secret=SECRET&issuer=Issuer"
        fontSize="1.3rem"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('123456')).toBeInTheDocument();
    });

    expect(mockGenerateTOTP).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'TOTP', secret: 'secret' })
    );

    view.unmount();
  });

  it('shows error message when URI decoding fails', async () => {
    mockDecodeOTPAuthURI.mockImplementation(() => {
      throw new Error('Invalid URI');
    });

    render(<OTPField uri="invalid" fontSize="1.3rem" />);

    expect(await screen.findByText('読み込めませんでした')).toBeInTheDocument();
  });

  it('renders without crashing with valid TOTP URI', () => {
    const totpURI =
      'otpauth://totp/Example:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example';

    const { container } = render(<OTPField uri={totpURI} />);

    // コンポーネントが正常にレンダリングされることを確認
    expect(container).toBeInTheDocument();
    expect(container.querySelector('.otp-field')).toBeInTheDocument();
  });

  it('renders error message when invalid URI is provided', () => {
    const { container } = render(<OTPField uri="invalid-uri" />);

    expect(container.textContent).toContain('読み込めませんでした');
  });

  it('renders HOTP correctly without generating OTP initially', () => {
    mockDecodeOTPAuthURI.mockReturnValue({
      type: 'HOTP',
      label: 'user@example.com',
      issuer: 'Example',
      algorithm: 'SHA1',
      digits: 6,
      counter: 0,
      secret: 'JBSWY3DPEHPK3PXP',
    } as any);

    const hotpURI =
      'otpauth://hotp/Example:user@example.com?secret=JBSWY3DPEHPK3PXP&counter=0&issuer=Example';

    const { container } = render(<OTPField uri={hotpURI} />);

    // 初期状態では●が表示される（クリックするまでOTPは生成されない）
    expect(container.textContent).toContain('●●●●●●');
  });
});
