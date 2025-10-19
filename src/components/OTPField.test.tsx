import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

import OTPField from './OTPField';

describe('OTPField', () => {
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
    const hotpURI =
      'otpauth://hotp/Example:user@example.com?secret=JBSWY3DPEHPK3PXP&counter=0&issuer=Example';

    const { container } = render(<OTPField uri={hotpURI} />);

    // 初期状態では●が表示される（クリックするまでOTPは生成されない）
    expect(container.textContent).toContain('●●●●●●');
  });
});
