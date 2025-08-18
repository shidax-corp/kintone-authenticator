import React from 'react';

import { isValidURL } from '@lib/url';

import OTPField from '@components/OTPField';
import PasswordField from '@components/PasswordField';
import TextField from '@components/TextField';

export interface AccountCardProps {
  appId: number;
  viewId: number;
  account: kintone.types.SavedFields;
}

export default function AccountCard({
  appId,
  viewId,
  account: { $id, name, username, password, otpuri, url },
}: AccountCardProps) {
  const onUpdateURI = async (uri: string) => {
    kintone.api('/k/v1/record.json', 'PUT', {
      app: appId,
      id: $id.value,
      record: {
        otpuri: {
          value: uri,
        },
      },
    });
  };

  return (
    <li>
      <div>
        <a
          href={`/k/${appId}/show#record=${$id.value}&l.view=${viewId}&l.q`}
          className="detail"
        >
          {name.value}
        </a>
        {isValidURL(url.value) ? (
          <a
            href={url.value}
            className="url"
            target="_blank"
            rel="noopener noreferrer"
          >
            {url.value}
          </a>
        ) : (
          <span className="url">{url.value}</span>
        )}
      </div>
      {username.value ? (
        <TextField label="ユーザー名" value={username.value} />
      ) : null}
      {password.value ? <PasswordField value={password.value} /> : null}
      {otpuri.value ? (
        <OTPField uri={otpuri.value} onUpdate={onUpdateURI} />
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
}
