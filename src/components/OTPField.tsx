import { useEffect, useRef, useState } from 'react';

import type { OTP } from '@lib/gen-otp';
import { generateHOTP, generateTOTP, prettifyOTP } from '@lib/gen-otp';
import {
  type OTPAuthRecord,
  decodeOTPAuthURI,
  encodeOTPAuthURI,
} from '@lib/otpauth-uri';

import CopyField, {
  COPIED_MESSAGE_DURATION,
  copyToClipboard,
} from '@components/CopyField';
import Field from '@components/Field';

export interface OTPProps {
  uri: string;
  onClick?: (otp: string) => void;
  onUpdate?: (newURI: string) => void;
  className?: string;
}

/**
 * ワンタイムパスワードを表示するコンポーネント
 *
 * @param uri - OTP Auth URI。
 * @param onClick - OTPがクリックされたときのコールバック関数。デフォルトではOTPをコピーする。
 * @param onUpdate - HOTPのカウンターが更新されたときに呼び出されるコールバック関数。引数にはい新しいURIが渡される。
 * @param className - OTPを表示する枠のコンポーネントに適用する追加のCSSクラス。
 */
export default function OTPField({
  uri: initialURI,
  onClick,
  onUpdate,
  className,
}: OTPProps) {
  const [uri, setUri] = useState(initialURI);
  const [info, setInfo] = useState<OTPAuthRecord | null>(null);
  const [otp, setOtp] = useState<OTP | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [toSelectOTP, setToSelectOTP] = useState<string | null>(null); // HOTPを再生成したときに選択するためのフラグ。この値と異なる値に変更された場合にOTPを選択する。
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let info: OTPAuthRecord | null = null;
    try {
      info = decodeOTPAuthURI(uri);
      setInfo(info);
    } catch {
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
          .catch(() => {
            setError('計算に失敗しました');
            setOtp(null);
          });
      };
      generate();
    }
  }, [uri]);

  const setSelection = () => {
    if (!ref.current) return;

    const range = document.createRange();
    range.selectNodeContents(ref.current);

    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
  };

  // HOTPクリック後のDOM更新を監視して選択を実行
  useEffect(() => {
    if (toSelectOTP && otp && otp?.otp !== toSelectOTP && ref.current) {
      setSelection();
      setToSelectOTP(null);
    }
  }, [otp, toSelectOTP]);

  const handleCallback = (otp: string) => {
    if (onClick) {
      onClick(otp);
    } else {
      copyToClipboard(otp).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), COPIED_MESSAGE_DURATION);
      });
    }
  };

  const onClickHandler = () => {
    if (info?.type === 'TOTP' && otp?.otp) {
      setSelection();
      handleCallback(otp.otp);
    } else if (info?.type === 'HOTP') {
      // HOTPの場合は非同期処理後に選択する必要があるのでフラグを立てる
      // 今のOTPから変わったことを検知できるように、ここで今の値を保持しておく。
      // 現時点で空欄の場合は何にせよ選択してほしいので、適当な値（anyway)を設定する。
      setToSelectOTP(otp?.otp ?? 'anyway');

      generateHOTP(info, info.counter)
        .then((generatedOtp) => {
          setOtp(generatedOtp);
          handleCallback(generatedOtp.otp);

          if (onUpdate) {
            const newURI = encodeOTPAuthURI({
              ...info,
              counter: info.counter + 1,
            });
            onUpdate(newURI);
            setUri(newURI);
          }
        })
        .catch(() => {
          setError('計算に失敗しました');
          setOtp(null);
          setToSelectOTP(null);
        });
    }
  };

  return (
    <div>
      <Field
        label="ワンタイムパスワード"
        onClick={info ? () => onClickHandler() : undefined}
      >
        <CopyField className={`otp-field ${className}`} copied={copied}>
          {/* HOTPの対応が必要なので、組込みのコピー機能は使わない */}
          <span ref={ref}>
            {error
              ? error
              : !otp
                ? '●●●●●●'
                : prettifyOTP(otp.otp)
                    .split(' ')
                    .map((part) => <span key={part}>{part}</span>)}
          </span>
        </CopyField>

        {otp?.type === 'TOTP' && (
          <Timer from={otp.availableFrom} until={otp.availableUntil} />
        )}
      </Field>

      <style jsx>{`
        div :global(.otp-field) {
          font-size: 1.3rem;
          cursor: ${info ? 'pointer' : 'default'};
        }
        span > span {
          margin-right: 0.5rem;
        }
        span > span:last-child {
          margin-right: 0;
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
