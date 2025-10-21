import { useEffect, useEffectEvent, useState } from 'react';

import InputField from '@components/InputField';
import OTPInputField from '@components/OTPInputField';
import PasscodeInputField from '@components/PasscodeInputField';

import EncryptedField from '../components/EncryptedField';

export interface FormAppProps {
  record: kintone.types.Fields;
}

export default function FormApp({ record }: FormAppProps) {
  const [encryptionPasscode, setEncryptionPasscode] = useState<string | null>(
    null
  );

  // 暗号化しない要素
  const [name, setName] = useFieldState('name', record?.name.value || '');
  const [url, setUrl] = useFieldState('url', record?.url.value || '');

  // 暗号化する要素
  const [username, setUsername] = useFieldState(
    'username',
    record?.username.value || ''
  );
  const [password, setPassword] = useFieldState(
    'password',
    record?.password.value || ''
  );
  const [otpuri, setOtpuri] = useFieldState(
    'otpuri',
    record?.otpuri.value || ''
  );

  // 標準のフィールドは使わないので非表示にする
  useEffect(() => {
    kintone.app.record.setFieldShown('name', false);
    kintone.app.record.setFieldShown('url', false);
    kintone.app.record.setFieldShown('username', false);
    kintone.app.record.setFieldShown('password', false);
    kintone.app.record.setFieldShown('otpuri', false);
  }, []);

  return (
    <div>
      <InputField
        label="名前"
        placeholder="サイト名"
        value={name}
        onChange={setName}
        type="text"
        required
      />
      <InputField
        label="URL"
        placeholder="https://example.com"
        value={url}
        onChange={setUrl}
        type="url"
      />
      <EncryptedInputField
        label="ユーザー名"
        placeholder=""
        value={username}
        onChange={setUsername}
        encryptionPasscode={encryptionPasscode}
      />
      <EncryptedInputField
        label="パスワード"
        value={password}
        onChange={setPassword}
        encryptionPasscode={encryptionPasscode}
      />
      <EncryptedField
        label="ワンタイムパスワード"
        value={otpuri}
        onChange={setOtpuri}
        encryptionPasscode={encryptionPasscode}
      >
        {(decryptedValue, onDecryptedChange) => (
          <OTPInputField
            label="ワンタイムパスワード"
            value={decryptedValue}
            onChange={useEffectEvent((value, info) => {
              onDecryptedChange!(value);

              if (!name && info?.issuer) {
                setName(info.issuer);
              }
              if (!username && info?.accountName) {
                setUsername(info.accountName);
              }
            })}
          />
        )}
      </EncryptedField>
      <PasscodeInputField
        value={encryptionPasscode}
        onChange={setEncryptionPasscode}
      />
      <style jsx>{`
        div > :global(*) {
          margin-bottom: 1em;
        }
      `}</style>
    </div>
  );
}

const useFieldState = (
  fieldName: keyof kintone.types.Fields,
  initialValue: string
): [string, (value: string) => void] => {
  const [value, setValue] = useState<string>(initialValue);

  useEffect(() => {
    const { record } = kintone.app.record.get();

    kintone.app.record.set({
      record: {
        ...record,
        [fieldName]: {
          value,
          type: record[fieldName].type,
        },
      },
    });
  }, [fieldName, value]);

  return [value, setValue];
};

interface EncryptedInputFieldProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (newValue: string) => void;
  encryptionPasscode: string | null;
}

function EncryptedInputField({
  label,
  placeholder = '',
  value,
  onChange,
  encryptionPasscode,
}: EncryptedInputFieldProps) {
  return (
    <EncryptedField
      label={label}
      value={value}
      onChange={onChange}
      encryptionPasscode={encryptionPasscode}
    >
      {(decryptedValue, onDecryptedChange) => (
        <InputField
          label={label}
          placeholder={placeholder}
          value={decryptedValue}
          onChange={onDecryptedChange!}
          type="text"
        />
      )}
    </EncryptedField>
  );
}
