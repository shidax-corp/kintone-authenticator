import { useState } from 'react';

import { decrypt, isEncrypted } from '@lib/crypto';
import { isValidURL } from '@lib/url';

import { useKeychain } from '@components/Keychain';
import OTPField from '@components/OTPField';
import PasswordField from '@components/PasswordField';
import TextField from '@components/TextField';

interface RecordItemProps {
  record: kintone.types.SavedFields;
  onFieldSelect?: (
    type: 'username' | 'password' | 'otp',
    value: string,
    recordId?: string
  ) => void;
  isModal?: boolean;
}

export const RecordItem = ({
  record,
  onFieldSelect,
  isModal = false,
}: RecordItemProps) => {
  const [usernameState, setUsername] = useState(record.username?.value || '');
  const [passwordState, setPassword] = useState(record.password?.value || '');
  const [otpuriState, setOtpuri] = useState(record.otpuri?.value || '');

  const isEncryptedRecord =
    isEncrypted(usernameState) ||
    isEncrypted(passwordState) ||
    isEncrypted(otpuriState);

  // Keychainからパスコードを取得して復号化
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

  const handleUsernameClick = (value: string) => {
    if (isModal && onFieldSelect) {
      onFieldSelect('username', value, record.$id.value);
    }
  };

  const handlePasswordClick = (value: string) => {
    if (isModal && onFieldSelect) {
      onFieldSelect('password', value, record.$id.value);
    }
  };

  const handleOtpClick = (otp: string) => {
    if (isModal && onFieldSelect) {
      onFieldSelect('otp', otp, record.$id.value);
    }
  };

  return (
    <li>
      <div>
        <span className="detail">{record.name?.value}</span>
        {record.url?.value && isValidURL(record.url.value) ? (
          <a
            href={record.url.value}
            className="url"
            target="_blank"
            rel="noopener noreferrer"
          >
            {record.url.value}
          </a>
        ) : (
          <span className="url">{record.url?.value}</span>
        )}
      </div>

      {/* ユーザー名フィールド */}
      {!usernameState ? null : isEncrypted(usernameState) ? (
        <MaskedField label="ユーザー名" />
      ) : (
        <TextField
          label="ユーザー名"
          value={usernameState}
          onClick={
            isModal && usernameState
              ? () => handleUsernameClick(usernameState)
              : undefined
          }
          className="copy-field"
        />
      )}

      {/* パスワードフィールド */}
      {!passwordState ? null : isEncrypted(passwordState) ? (
        <MaskedField label="パスワード" />
      ) : (
        <PasswordField
          value={passwordState}
          onClick={
            isModal && passwordState
              ? () => handlePasswordClick(passwordState)
              : undefined
          }
          className="copy-field"
        />
      )}

      {/* OTPフィールド */}
      {!otpuriState ? null : isEncrypted(otpuriState) ? (
        <MaskedField label="ワンタイムパスワード" />
      ) : (
        <OTPField
          uri={otpuriState}
          onClick={isModal ? handleOtpClick : undefined}
        />
      )}

      <style jsx>{`
        li {
          display: block;
          padding: 16px;
          border: 1px solid var(--ka-bg-dark-color);
        }
        div {
          margin: 0 0 8px;
          white-space: nowrap;
          overflow: hidden;
        }
        .detail {
          font-weight: bold;
          margin-right: 8px;
        }
        .url {
          color: var(--ka-fg-light-color);
          text-decoration: none;
        }
        a.url:hover {
          text-decoration: underline;
        }
        li :global(.copy-field) {
          cursor: pointer;
        }
      `}</style>
    </li>
  );
};
