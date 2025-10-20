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
});
