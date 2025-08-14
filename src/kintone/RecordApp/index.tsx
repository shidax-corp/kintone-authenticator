import React, { useEffect, useState } from 'react';

import { isValidURL } from '@lib/url';
import Field from '@components/Field';
import TextField from '@components/TextField';
import PasswordField from '@components/PasswordField';
import OTPField from '@components/OTPField';

export interface RecordAppProps {
  record: kintone.types.SavedFields;
}

export default function RecordApp({
  record: { name, username, password, otpuri, url },
}: RecordAppProps) {
  useEffect(() => {
    kintone.app.record.setFieldShown('name', false);
    kintone.app.record.setFieldShown('url', false);
    kintone.app.record.setFieldShown('username', false);
    kintone.app.record.setFieldShown('password', false);
    kintone.app.record.setFieldShown('otpuri', false);
  }, []);

  return (
    <>
      <Field label="名前">
        <div>{name.value}</div>
      </Field>

      {url.value ? (
        <Field label="URL">
          <div>
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

      {username.value ? (
        <TextField label="ユーザー名" value={username.value} />
      ) : (
        <EmptyField label="ユーザー名" />
      )}
      {password.value ? (
        <PasswordField value={password.value} />
      ) : (
        <EmptyField label="パスワード" />
      )}
      {otpuri.value ? (
        <OTPField uri={otpuri.value} />
      ) : (
        <EmptyField label="ワンタイムパスワード" />
      )}

      <style jsx>{`
        div {
          padding: var(--ka-field-padding);
        }
      `}</style>
    </>
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
