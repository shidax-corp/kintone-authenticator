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
  // Keychainから読み取ったときにも、PasscodePromptから入力されたときにも呼ばれる。
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
    kintone.mobile.app.record.setFieldShown('name', false);
    kintone.mobile.app.record.setFieldShown('url', false);
    kintone.mobile.app.record.setFieldShown('username', false);
    kintone.mobile.app.record.setFieldShown('password', false);
    kintone.mobile.app.record.setFieldShown('otpuri', false);
  }, []);

  return (
    <div className="detail">
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
        <TextField label="ユーザー名" value={usernameState} className="field" />
      )}

      {!passwordState ? (
        <EmptyField label="パスワード" />
      ) : isEncrypted(passwordState) ? (
        <MaskedField label="パスワード" />
      ) : (
        <PasswordField value={passwordState} className="field" />
      )}

      {!otpuriState ? (
        <EmptyField label="ワンタイムパスワード" />
      ) : isEncrypted(otpuriState) ? (
        <MaskedField label="ワンタイムパスワード" />
      ) : (
        <OTPField uri={otpuriState} fontSize="2.5rem" />
      )}

      <style jsx>{`
        .detail {
          margin: 0 16px 40px;
          --ka-bg-tint-rgb: 245, 245, 245;
          --ka-bg-tint-color: rgb(var(--ka-bg-tint-rgb));
        }
        .detail > :global(*) {
          margin-bottom: 1em;
        }
        .field {
          padding: var(--ka-field-padding);
        }
        .detail :global(div:has(> .field)) {
          border-radius: 6px;
        }
        .detail :global(div:has(> .otp-field)) {
          border-radius: 6px;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

function EmptyField({ label }: { label: string }) {
  return (
    <Field label={label}>
      <div className="field">未設定</div>
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
