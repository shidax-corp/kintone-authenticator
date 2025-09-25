import { useCallback, useEffect, useState } from 'react';

import { generateHOTP, generateTOTP } from '@lib/gen-otp';
import { type OTPAuthRecord, decodeOTPAuthURI } from '@lib/otpauth-uri';

import QRScanner from '@components/QRScanner';

export type ScannerProps = {
  onRead: (uri: string, info: OTPAuthRecord) => void;
};

export default function Scanner({ onRead }: ScannerProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // スクロールされてカメラビューが見えなくならないように、スクロールできない状態にする。
    const main = document.querySelector(
      'main.gaia-mobile-v2-viewpanel-contents'
    );
    if (main instanceof HTMLElement) {
      main.scrollTo(0, 0);
      main.style.overflowY = 'hidden';
    }
    return () => {
      if (main instanceof HTMLElement) {
        main.style.overflowY = '';
      }
    };
  }, []);

  const onError = useCallback(
    (err: unknown) => {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('読み取れませんでした');
      }
      const timer = setTimeout(() => {
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    },
    [setError]
  );

  const onReadCallback = useCallback(
    (uri: string) => {
      try {
        const record = decodeOTPAuthURI(uri);
        if (record.type === 'TOTP') {
          generateTOTP(record).then(() => {
            onRead(uri, record);
          });
        } else if (record.type === 'HOTP') {
          generateHOTP(record, record.counter).then(() => {
            onRead(uri, record);
          });
        }
      } catch (err) {
        onError(err);
      }
    },
    [onRead, onError]
  );

  return (
    <div>
      <QRScanner onRead={onReadCallback} onError={onError} />

      <h1>QRコードをスキャン</h1>

      {error && <p>{error}</p>}

      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <path d="M10 30 L10 10 L30 10" />
        <path d="M90 30 L90 10 L70 10" />
        <path d="M10 70 L10 90 L30 90" />
        <path d="M90 70 L90 90 L70 90" />
      </svg>

      <style jsx>{`
        div {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          margin: 0 !important;
        }

        h1 {
          position: absolute;
          top: 16px;
          left: 16px;
          right: 16px;
          text-align: center;
          margin: 0;
          color: #fff;
          font-size: inherit;
          font-weight: bold;
          text-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
        }

        p {
          position: absolute;
          bottom: 32px;
          left: 8px;
          right: 8px;
          text-align: center;
          margin: 0;
          color: #ff8080;
          font-size: inherit;
          font-weight: bold;
          text-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
        }

        svg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        path {
          fill: none;
          stroke: #fff;
          stroke-width: 1;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
      `}</style>
    </div>
  );
}
