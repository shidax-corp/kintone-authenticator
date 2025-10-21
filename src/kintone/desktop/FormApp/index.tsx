import { useEffect, useState } from 'react';

import { decrypt, encrypt, isEncrypted } from '@lib/crypto';
import type { OTPAuthRecord } from '@lib/otpauth-uri';

import InputField from '@components/InputField';
import MaskedField from '@components/MaskedField';
import OTPInputField from '@components/OTPInputField';
import PasscodeInputField from '@components/PasscodeInputField';

import PasscodeDialog from '../components/PasscodeDialog';

export interface FormAppProps {
  record: kintone.types.Fields;
}

export default function FormApp({ record }: FormAppProps) {
  const [encryptionPasscode, setEncryptionPasscode] = useState<string | null>(
    null
  );
  const [showPasscodeDialog, setShowPasscodeDialog] = useState(false);

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

  const isEncryptedRecord =
    isEncrypted(username) || isEncrypted(password) || isEncrypted(otpuri);

  const onReadOTP = (value: string, info: OTPAuthRecord | null) => {
    setOtpuri(value);

    if (!name && info?.issuer) {
      setName(info.issuer);
    }
    if (!username && info?.accountName) {
      setUsername(info.accountName);
    }
  };

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
      {isEncryptedRecord ? (
        <>
          <MaskedField
            label="ユーザー名"
            onClick={() => setShowPasscodeDialog(true)}
          />
          <MaskedField
            label="パスワード"
            onClick={() => setShowPasscodeDialog(true)}
          />
          <MaskedField
            label="ワンタイムパスワード"
            onClick={() => setShowPasscodeDialog(true)}
          />
        </>
      ) : (
        <>
          <InputField
            label="ユーザー名"
            placeholder=""
            value={username}
            onChange={setUsername}
            type="text"
          />
          <InputField
            label="パスワード"
            placeholder=""
            value={password}
            onChange={setPassword}
            type="text"
          />
          <OTPInputField
            label="ワンタイムパスワード"
            value={otpuri}
            onChange={onReadOTP}
          />
          <PasscodeInputField
            value={encryptionPasscode}
            onChange={setEncryptionPasscode}
          />
        </>
      )}
      <style jsx>{`
        div > :global(*) {
          margin-bottom: 1em;
        }
      `}</style>

      {showPasscodeDialog && (
        <PasscodeDialog
          callback={(passcode) => {
            setShowPasscodeDialog(false);

            if (passcode) {
              (async () => {
                setEncryptionPasscode(passcode);

                if (username && isEncrypted(username)) {
                  setUsername(await decrypt(username, passcode));
                }

                if (password && isEncrypted(password)) {
                  setPassword(await decrypt(password, passcode));
                }

                if (otpuri && isEncrypted(otpuri)) {
                  setOtpuri(await decrypt(otpuri, passcode));
                }
              })().catch((err) => {
                console.error('Error decrypting field values:', err);
                // TODO: ユーザーにエラーを表示してもう一度ダイアログを開く
              });
            }
          }}
        />
      )}
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
    if (isEncrypted(value)) {
      // 暗号化されている場合は二重暗号化を防ぐために何もしない。
      return;
    }

    const { record } = kintone.app.record.get();
    const v =
      encryptionPasscode && value
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
