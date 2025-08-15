import React, { useState, useEffect, useCallback } from 'react';

import { decodeOTPAuthURI } from '@lib/otpauth-uri';
import { generateTOTP, generateHOTP, prettifyOTP } from '@lib/gen-otp';
import Field from '@components/Field';

import Scanner from './Scanner';
import QRFileReader from './QRFileReader';
import { isClipboardAvailable, readQRFromClipboard } from './clipboard';

export interface OTPInputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

/**
 * OTP Auth URIを入力するためのフィールドコンポーネント。
 *
 * カメラからのQRコードスキャン、ファイルからの読み取り、画像のコピー&ペースト、手入力の4種類の方法をサポートする。
 *
 * @param label - フィールドの上に表示するラベル。
 * @param onChange - 入力値が変更されたときに呼び出されるコールバック関数。
 */
export default function OTPInputField({
  label,
  value,
  onChange,
}: OTPInputFieldProps) {
  const [code, setCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState<boolean>(false);
  const [reading, setReading] = useState<boolean>(false);

  const readURI = async (uri: string) => {
    try {
      const record = decodeOTPAuthURI(uri);
      if (record.type === 'TOTP') {
        const otp = await generateTOTP(record);
        setCode(otp.otp);
      } else if (record.type === 'HOTP') {
        const otp = await generateHOTP(record, record.counter);
        setCode(otp.otp);
      }
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('読み取れませんでした');
      }
      throw err;
    }
  };

  // 親コンポーネントから値を指定された場合はそれを読み取る。
  useEffect(() => {
    if (value) {
      readURI(value).catch(() => {
        onChange(''); // 無効なOTP Auth URIが設定されている場合は、空文字列にリセットする。
        setCode(''); // コードの表示も消す。
      });
    }
  }, [value]);

  const onRead = useCallback(
    (data: string) => {
      setError(null);
      readURI(data)
        .then(() => onChange(data))
        .catch(() => {
          // エラーは既にsetErrorで設定されているので、ここでは何もしない。
          // すでにセットされている値は触らないでおく。
        });
    },
    [onChange]
  );

  const onError = useCallback((error: Error) => {
    setError(error.message);
  }, []);

  return (
    <Field label={label}>
      <div>
        <span className="preview">{code ? prettifyOTP(code) : '未設定'}</span>
        <button onClick={() => setScanning(true)}>スキャン</button>
        <button onClick={() => setReading(true)}>参照</button>
        {isClipboardAvailable() && (
          <button onClick={() => readQRFromClipboard({ onRead, onError })}>
            貼り付け
          </button>
        )}
        {error && <span className="err">{error}</span>}
      </div>

      <Scanner
        open={scanning}
        onRead={onRead}
        onError={onError}
        onClose={() => setScanning(false)}
      />

      <QRFileReader
        open={reading}
        onRead={onRead}
        onError={onError}
        onClose={() => setReading(false)}
      />

      <style jsx>{`
        div {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: var(--ka-field-padding);
          background-color: var(--ka-bg-color);
        }
        .preview {
          color: var(--ka-fg-light-color);
          margin-right: 4px;
          padding-right: 20px;
          border-right: 1px solid rgba(var(--ka-fg-rgb), 0.4);
          font-size: calc(var(--ka-font-size) * 1.2);
          user-select: all;
        }
        button {
          background: none;
          border: none;
          padding: 4px 12px;
          color: var(--ka-primary-color);
          cursor: pointer;
          font-size: var(--ka-font-size);
        }
        button:hover:not(:disabled),
        button:active:not(:disabled) {
          color: color-mix(in srgb, var(--ka-primary-color) 80%, #000);
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .err {
          color: var(--ka-fg-error-color);
          margin-top: 4px;
        }
      `}</style>
    </Field>
  );
}
