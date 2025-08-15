import React, { useState } from 'react';
import type { ClipboardEvent } from 'react';

import { decodeOTPAuthURI } from '@lib/otpauth-uri';
import { generateTOTP, generateHOTP } from '@lib/gen-otp';
import Field from '@components/Field';

import Scanner from './Scanner';
import FileReader from './FileReader';

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

  const handleChange = async (uri: string) => {
    try {
      const record = decodeOTPAuthURI(uri);
      if (record.type === 'TOTP') {
        const otp = await generateTOTP(record);
        setCode(otp.otp);
      } else if (record.type === 'HOTP') {
        const otp = await generateHOTP(record, record.counter);
        setCode(otp.otp);
      }
      onChange(uri);
      setError(null);
    } catch (err) {
      console.error('Error processing OTP URI:', err);
      setError(err instanceof Error ? err.message : '読み取れませんでした');
    }
  };

  const readFromClipboard = () => {
    // TODO: クリップボードからの読み取りを実装する
  };

  return (
    <Field label={label}>
      <div>
        <span>{code ? code : '未設定'}</span>
        <button onClick={() => setScanning(true)}>スキャン</button>
        <button onClick={() => setReading(true)}>参照</button>
        <button onClick={() => readFromClipboard()}>貼り付け</button>
        {error && <div className="err">{error}</div>}
      </div>

      <Scanner
        open={scanning}
        onScan={(uri) => {
          setScanning(false);
          handleChange(uri);
        }}
        onError={(err) => {
          setScanning(false);
          setError(err.message);
        }}
        onClose={() => setScanning(false)}
      />

      <FileReader
        open={reading}
        onFileRead={(uri) => {
          setReading(false);
          handleChange(uri);
        }}
        onError={(err) => {
          setReading(false);
          setError(err.message);
        }}
        onClose={() => setReading(false)}
      />

      <style jsx>{`
        div {
          display: flex;
          gap: 8px;
          padding: var(--ka-field-padding);
        }
        span {
          color: var(--ka-fg-light-color);
          margin-right: 12px;
        }
        button {
          background: none;
          border: none;
          padding: 4px 12px;
          color: var(--ka-primary-color);
          cursor: pointer;
        }
        button:hover,
        button:active {
          color: color-mix(in srgb, var(--ka-primary-color) 80%, #000);
        }
        .err {
          color: var(--ka-fg-error-color);
          margin-top: 4px;
        }
      `}</style>
    </Field>
  );
}
