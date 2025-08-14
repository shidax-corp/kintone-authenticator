import React, { useState, useEffect, ReactNode } from 'react';

import {
  decodeOTPAuthURI,
  encodeOTPAuthURI,
  OTPAuthRecord,
} from '@lib/otpauth-uri';
import type { OTP } from '@lib/gen-otp';
import { generateHOTP, generateTOTP, prettifyOTP } from '@lib/gen-otp';
import Field from '@components/Field';
import CopyField from '@components/CopyField';

export interface OTPProps {
  uri: string;
  onclick?: (otp: string) => void;
  onupdate?: (newURI: string) => void;
}

/**
 * ワンタイムパスワードを表示するコンポーネント
 *
 * @param uri - OTP Auth URI。
 * @param onclick - OTPがクリックされたときのコールバック関数。デフォルトではOTPをコピーする。
 * @param onupdate - HOTPのカウンターが更新されたときに呼び出されるコールバック関数。引数にはい新しいURIが渡される。
 */
export default function OTPField({ uri, onclick, onupdate }: OTPProps) {
  const [info, setInfo] = useState<OTPAuthRecord | null>(null);
  const [otp, setOtp] = useState<OTP | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let info: OTPAuthRecord | null = null;
    try {
      info = decodeOTPAuthURI(uri);
      setInfo(info);
    } catch (e) {
      console.error('Failed to decode OTP Auth URI:', e);
      info = null;
    }
    if (!info) {
      setError('読み込めませんでした');
      return;
    }
    setError(null);

    if (info.type === 'TOTP') {
      const generate = () => {
        generateTOTP(info)
          .then((generatedOtp) => {
            setOtp(generatedOtp);
            setTimeout(
              generate,
              generatedOtp.availableUntil.getTime() - Date.now()
            );
          })
          .catch((error) => {
            console.error('Failed to generate TOTP:', error);
            setError('計算に失敗しました');
            setOtp(null);
          });
      };
      generate();
    }
  }, [uri]);

  const onClickHandler = () => {
    if (info?.type === 'TOTP' && otp?.otp) {
      onclick?.(otp.otp);
    } else if (info?.type === 'HOTP') {
      generateHOTP(info, info.counter)
        .then((generatedOtp) => {
          setOtp(generatedOtp);
          if (onupdate) {
            const newURI = encodeOTPAuthURI({
              ...info,
              counter: info.counter + 1,
            });
            onupdate(newURI);
          }
        })
        .catch((error) => {
          console.error('Failed to generate HOTP:', error);
          setError('計算に失敗しました');
          setOtp(null);
        });
    }
  };

  return (
    <div>
      <Field
        label="ワンタイムパスワード"
        onClick={info ? () => onClickHandler() : undefined}
      >
        <CopyField value={otp?.otp || ''} className="otp-field">
          {error ? error : !otp ? '●●●●●●' : prettifyOTP(otp.otp)}
        </CopyField>

        {otp?.type === 'TOTP' && (
          <Timer from={otp.availableFrom} until={otp.availableUntil} />
        )}
      </Field>

      <style jsx>{`
        div :global(.otp-field) {
          font-size: 1.3rem;
        }
      `}</style>
    </div>
  );
}

type TimerProps = {
  from: Date;
  until: Date;
};

function Timer({ from, until }: TimerProps) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    let running = true;

    const updateRemaining = () => {
      if (!running) return;

      const timeLeft = until.getTime() - Date.now();
      const duration = until.getTime() - from.getTime();
      setRemaining(Math.max(0, (timeLeft / duration) * 100));

      requestAnimationFrame(updateRemaining);
    };
    updateRemaining();

    return () => {
      running = false;
    };
  }, [from, until]);

  return (
    <div>
      <span style={{ width: `${100 - remaining}%` }}></span>
      <style jsx>{`
        & {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background-color: rgba(0, 0, 0, 0.1);
        }
        span {
          position: absolute;
          left: 0;
          bottom: 0;
          height: 100%;
          background-color: var(--ka-primary-color);
        }
      `}</style>
    </div>
  );
}
