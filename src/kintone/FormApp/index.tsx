import React, { useEffect, useState } from 'react';

import InputField from '@components/InputField';
import OTPInputField from '@components/OTPInputField';

export interface FormAppProps {
  record: kintone.types.Fields;
}

export default function FormApp({ record }: FormAppProps) {
  useEffect(() => {
    kintone.app.record.setFieldShown('name', false);
    kintone.app.record.setFieldShown('url', false);
    kintone.app.record.setFieldShown('username', false);
    kintone.app.record.setFieldShown('password', false);
    kintone.app.record.setFieldShown('otpuri', false);
  }, []);

  const [name, setName] = useState(record?.name.value || '');
  const [url, setUrl] = useState(record?.url.value || '');
  const [username, setUsername] = useState(record?.username.value || '');
  const [password, setPassword] = useState(record?.password.value || '');
  const [otpuri, setOtpuri] = useState(record?.otpuri.value || '');

  const withWriteBack = (
    field: keyof kintone.types.Fields,
    setter: (value: string) => void
  ) => {
    return (value: string) => {
      setter(value);
      kintone.app.record.set({
        record: {
          ...kintone.app.record.get().record,
          [field]: {
            value: value,
            type: record[field].type,
          },
        },
      });
    };
  };

  return (
    <div>
      <InputField
        label="名前"
        placeholder="サイト名"
        value={name}
        onChange={withWriteBack('name', setName)}
        type="text"
        required
      />
      <InputField
        label="URL"
        placeholder="https://example.com"
        value={url}
        onChange={withWriteBack('url', setUrl)}
        type="url"
      />
      <InputField
        label="ユーザー名"
        placeholder=""
        value={username}
        onChange={withWriteBack('username', setUsername)}
        type="text"
      />
      <InputField
        label="パスワード"
        placeholder=""
        value={password}
        onChange={withWriteBack('password', setPassword)}
        type="text"
      />
      <OTPInputField
        label="ワンタイムパスワード"
        value={otpuri}
        onChange={(value, info) => {
          withWriteBack('otpuri', setOtpuri)(value);

          if (!name && info?.issuer) {
            withWriteBack('name', setName)(info.issuer);
          }
          if (!username && info?.accountName) {
            withWriteBack('username', setUsername)(info.accountName);
          }
        }}
      />
      <style jsx>{`
        div > :global(*) {
          margin-bottom: 1em;
        }
      `}</style>
    </div>
  );
}
