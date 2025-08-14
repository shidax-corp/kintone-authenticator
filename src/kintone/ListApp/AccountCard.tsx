import React from 'react';

import TextField from '@components/TextField';
import PasswordField from '@components/PasswordField';
import OTPField from '@components/OTPField';

export interface AccountCardProps {
  account: kintone.types.Fields;
}

export default function AccountCard({
  account: { name, username, password, otpuri, url },
}: AccountCardProps) {
  return (
    <li>
      <div>
        <span>{name.value}</span>
        {url.value ? `: ${url.value}` : ''}
      </div>
      <TextField label="ユーザー名" value={username.value} />
      <PasswordField value={password.value} />
      <OTPField uri={otpuri.value} />
      <style jsx>{`
        li {
          display: block;
          padding: 16px;
          border: 1px solid var(--ka-bg-dark-color);
        }
        div {
          margin: 0 0 8px;
          color: var(--ka-fg-light-color);
          white-space: nowrap;
          overflow: hidden;
        }
        span {
          color: var(--ka-fg-color);
          font-weight: bold;
        }
      `}</style>
    </li>
  );
}
