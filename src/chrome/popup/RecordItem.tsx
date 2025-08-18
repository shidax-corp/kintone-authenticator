import React from 'react';

import { isValidURL } from '@lib/url';

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

export const RecordItem: React.FC<RecordItemProps> = ({
  record,
  onFieldSelect,
  isModal = false,
}) => {
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
    try {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_OTP_URI',
        data: {
          recordId: record.$id.value,
          otpAuthUri: newURI,
        },
      });
    } catch {
      // OTP URI update failure is not critical
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
      {record.username?.value ? (
        <TextField
          label="ユーザー名"
          value={record.username.value}
          onClick={
            isModal && record.username?.value
              ? () => handleUsernameClick(record.username.value)
              : undefined
          }
        />
      ) : null}
      {record.password?.value ? (
        <PasswordField
          value={record.password.value}
          onClick={
            isModal && record.password?.value
              ? () => handlePasswordClick(record.password.value)
              : undefined
          }
        />
      ) : null}
      {record.otpuri?.value ? (
        <OTPField
          uri={record.otpuri.value}
          onClick={isModal ? handleOtpClick : undefined}
          onUpdate={handleOtpUpdate}
        />
      ) : null}
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
      `}</style>
    </li>
  );
};
