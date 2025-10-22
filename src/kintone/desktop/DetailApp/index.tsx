import { useEffect, useState } from 'react';

import { decrypt, isEncrypted } from '@lib/crypto';
import { isValidURL } from '@lib/url';

import Field from '@components/Field';
import { useKeychain } from '@components/Keychain';
import OTPField from '@components/OTPField';
import PasswordField from '@components/PasswordField';
import TextField from '@components/TextField';

export interface DetailAppProps {
  record: kintone.types.SavedFields;
}

export default function DetailApp({
  record: { name, username, password, otpuri, url },
}: DetailAppProps) {
  // 暗号化されうる要素
  const [usernameState, setUsername] = useState(username.value);
  const [passwordState, setPassword] = useState(password.value);
  const [otpuriState, setOtpuri] = useState(otpuri.value);

  const isEncryptedRecord =
    isEncrypted(usernameState) ||
    isEncrypted(passwordState) ||
    isEncrypted(otpuriState);

  // パスコードが入力されたときの処理
  // Keychainから読み取ったときにも、PasscodeDialogから入力されたときにも呼ばれる。
  const { MaskedField } = useKeychain(async (passcode: string) => {
    if (!isEncryptedRecord) {
      return false;
    }

    try {
      if (usernameState && isEncrypted(usernameState)) {
        setUsername(await decrypt(usernameState, passcode));
      }

      if (passwordState && isEncrypted(passwordState)) {
        setPassword(await decrypt(passwordState, passcode));
      }

      if (otpuriState && isEncrypted(otpuriState)) {
        setOtpuri(await decrypt(otpuriState, passcode));
      }

      return true;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // 標準のフィールドは使わないので非表示にする
    kintone.app.record.setFieldShown('name', false);
    kintone.app.record.setFieldShown('url', false);
    kintone.app.record.setFieldShown('username', false);
    kintone.app.record.setFieldShown('password', false);
    kintone.app.record.setFieldShown('otpuri', false);
  }, []);

  return (
    <div>
      <Field label="名前">
        <div className="field">{name.value}</div>
      </Field>

      {url.value ? (
        <Field label="URL">
          <div className="field">
            {isValidURL(url.value) ? (
              <a
                href={url.value}
                target="_blank"
                rel="noopener noreferrer"
                className="url"
              >
                {url.value}
              </a>
            ) : (
              url.value
            )}
          </div>
        </Field>
      ) : (
        <EmptyField label="URL" />
      )}

      {!usernameState ? (
        <EmptyField label="ユーザー名" />
      ) : isEncrypted(usernameState) ? (
        <MaskedField label="ユーザー名" />
      ) : (
        <TextField label="ユーザー名" value={usernameState} />
      )}

      {!passwordState ? (
        <EmptyField label="パスワード" />
      ) : isEncrypted(passwordState) ? (
        <MaskedField label="パスワード" />
      ) : (
        <PasswordField value={passwordState} />
      )}

      {!otpuriState ? (
        <EmptyField label="ワンタイムパスワード" />
      ) : isEncrypted(otpuriState) ? (
        <MaskedField label="ワンタイムパスワード" />
      ) : (
        <OTPField uri={otpuriState} />
      )}

      <style jsx>{`
        & > :global(*) {
          margin-bottom: 1em;
        }
        .field {
          padding: var(--ka-field-padding);
        }
      `}</style>
    </div>
  );
}

function EmptyField({ label }: { label: string }) {
  return (
    <Field label={label}>
      <div>未設定</div>
      <style jsx>{`
        div {
          color: rgba(var(--ka-fg-light-rgb), 0.5);
          padding: var(--ka-field-padding);
          user-select: none;
        }
      `}</style>
    </Field>
  );
}
