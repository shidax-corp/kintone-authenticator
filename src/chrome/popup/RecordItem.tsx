import React from 'react';
import TextField from '@components/TextField';
import PasswordField from '@components/PasswordField';
import OTPField from '@components/OTPField';
import { isValidURL } from '@lib/url';
import type { KintoneRecord } from '../lib/types';

interface RecordItemProps {
  record: KintoneRecord;
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
      onFieldSelect('username', value, record.recordId);
    }
  };

  const handlePasswordClick = (value: string) => {
    if (isModal && onFieldSelect) {
      onFieldSelect('password', value, record.recordId);
    }
  };

  const handleOtpClick = (otp: string) => {
    if (isModal && onFieldSelect) {
      onFieldSelect('otp', otp, record.recordId);
    }
  };

  const handleOtpUpdate = async (newURI: string) => {
    try {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_OTP_URI',
        data: {
          recordId: record.recordId,
          otpAuthUri: newURI,
        },
      });
    } catch (error) {
      console.error('Failed to update OTP URI:', error);
    }
  };

  return (
    <li>
      <div>
        <span className="detail">{record.name}</span>
        {isValidURL(record.url) ? (
          <a
            href={record.url}
            className="url"
            target="_blank"
            rel="noopener noreferrer"
          >
            {record.url}
          </a>
        ) : (
          <span className="url">{record.url}</span>
        )}
      </div>
      {record.username ? (
        <TextField
          label="ユーザー名"
          value={record.username}
          onClick={
            isModal ? () => handleUsernameClick(record.username) : undefined
          }
        />
      ) : null}
      {record.password ? (
        <PasswordField
          value={record.password}
          onClick={
            isModal ? () => handlePasswordClick(record.password) : undefined
          }
        />
      ) : null}
      {record.otpAuthUri ? (
        <OTPField
          uri={record.otpAuthUri}
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
