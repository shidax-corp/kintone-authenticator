import { useCallback, useEffect, useRef, useState } from 'react';

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

  // 最新のstate値を参照するためのref
  const usernameRef = useRef(usernameState);
  const passwordRef = useRef(passwordState);
  const otpuriRef = useRef(otpuriState);

  useEffect(() => {
    usernameRef.current = usernameState;
    passwordRef.current = passwordState;
    otpuriRef.current = otpuriState;
  }, [usernameState, passwordState, otpuriState]);

  // Keychainからパスコードを取得して復号化
  // useCallbackでメモ化して不要な再実行を防ぐ
  const handlePasscode = useCallback(async (passcode: string) => {
    const username = usernameRef.current;
    const password = passwordRef.current;
    const otpuri = otpuriRef.current;

    const isEncryptedRec =
      isEncrypted(username) || isEncrypted(password) || isEncrypted(otpuri);

    if (!isEncryptedRec) {
      return false;
    }

    try {
      if (username && isEncrypted(username)) {
        setUsername(await decrypt(username, passcode));
      }

      if (password && isEncrypted(password)) {
        setPassword(await decrypt(password, passcode));
      }

      if (otpuri && isEncrypted(otpuri)) {
        setOtpuri(await decrypt(otpuri, passcode));
      }

      return true;
    } catch {
      return false;
    }
  }, []);

  const { MaskedField } = useKeychain(handlePasscode);

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

  const handleOtpUpdate = async (newURI: string) => {
    // HOTPカウンターが更新された場合、バックグラウンドスクリプトに通知してkintoneに保存
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'UPDATE_OTP_URI',
        data: {
          recordId: record.$id.value,
          otpuri: newURI,
        },
      });

      if (!response || !response.success) {
        console.error('Failed to update OTP URI:', response?.error);
      }
    } catch (error) {
      console.error('Failed to send UPDATE_OTP_URI message:', error);
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
          onUpdate={handleOtpUpdate}
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
