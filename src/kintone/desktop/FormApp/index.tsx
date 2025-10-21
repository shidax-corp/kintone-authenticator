import { useEffect, useEffectEvent, useState } from 'react';

import { encrypt } from '@lib/crypto';

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
    record?.username.value || '',
    encryptionPasscode
  );
  const [password, setPassword] = useFieldState(
    'password',
    record?.password.value || '',
    encryptionPasscode
  );
  const [otpuri, setOtpuri] = useFieldState(
    'otpuri',
    record?.otpuri.value || '',
    encryptionPasscode
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
      <InputField
        label="ユーザー名"
        placeholder=""
        value={username}
        onChange={setUsername}
        type="text"
      />
      <EncryptedField
        label="パスワード"
        value={password}
        onChange={setPassword}
        encryptionPasscode={encryptionPasscode}
      >
        {(value, onChange) => (
          <InputField
            label="パスワード"
            placeholder=""
            value={value}
            onChange={onChange!}
            type="text"
          />
        )}
      </EncryptedField>
      <OTPInputField
        label="ワンタイムパスワード"
        value={otpuri}
        onChange={useEffectEvent((value, info) => {
          setOtpuri(value);

          if (!name && info?.issuer) {
            setName(info.issuer);
          }
          if (!username && info?.accountName) {
            setUsername(info.accountName);
          }
        })}
      />
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
  initialValue: string,
  encryptionPasscode?: string | null
): [string, (value: string) => void] => {
  const [value, setValue] = useState<string>(initialValue);

  useEffect(() => {
    const { record } = kintone.app.record.get();
    const v = encryptionPasscode
      ? encrypt(value, encryptionPasscode)
      : Promise.resolve(value);

    v.then((encryptedValue) => {
      kintone.app.record.set({
        record: {
          ...record,
          [fieldName]: {
            value: encryptedValue,
            type: record[fieldName].type,
          },
        },
      });
    }).catch((err) => {
      console.error('Error encrypting field value:', err);
    });
  }, [fieldName, value, encryptionPasscode]);

  return [value, setValue];
};
