import { useEffect, useState } from 'react';

import InputField from '@components/InputField';

import OTPInputField from './OTPInputField';

export type FormAppProps = {
  record?: kintone.types.Fields;
};

export default function FormApp({ record }: FormAppProps) {
  useEffect(() => {
    kintone.mobile.app.record.setFieldShown('name', false);
    kintone.mobile.app.record.setFieldShown('url', false);
    kintone.mobile.app.record.setFieldShown('username', false);
    kintone.mobile.app.record.setFieldShown('password', false);
    kintone.mobile.app.record.setFieldShown('otpuri', false);
  }, []);

  const [name, setName] = useState(record?.name.value || '');
  const [url, setUrl] = useState(record?.url.value || '');
  const [username, setUsername] = useState(record?.username.value || '');
  const [password, setPassword] = useState(record?.password.value || '');
  const [otpuri, setOtpuri] = useState(record?.otpuri.value || '');

  const setFieldValue = (field: keyof kintone.types.Fields, value: string) => {
    const { record } = kintone.mobile.app.record.get();

    kintone.mobile.app.record.set({
      record: {
        ...record,
        [field]: {
          value: value,
          type: record[field].type,
        },
      },
    });
  };

  const withWriteBack = (
    field: keyof kintone.types.Fields,
    setter: (value: string) => void
  ) => {
    return (value: string) => {
      setter(value);
      setFieldValue(field, value);
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
        uri={otpuri}
        onScanned={(value, info) => {
          setOtpuri(value);
          setFieldValue('otpuri', value);

          if (!name && info.issuer) {
            setName(info.issuer);
            setFieldValue('name', info.issuer);
          }
          if (!username && info.accountName) {
            setUsername(info.accountName);
            setFieldValue('username', info.accountName);
          }
        }}
        openScannerByDefault={record == null}
      />
      <style jsx>{`
        div {
          margin-bottom: 28px;
          --ka-bg-input-rgb: 255, 255, 255;
          --ka-bg-input-color: rgb(var(--ka-bg-input-rgb));
        }
        div > :global(*) {
          margin: 0.5em 1em 1em 0.5em;
        }
        div :global(div:has(> input)) {
          margin-left: 0.5em;
          background-color: transparent;
        }
        div :global(input) {
          border-radius: 6px;
          border: 1px solid var(--ka-bg-dark-color);
          box-shadow: inset 0 2px 3px rgba(var(--ka-bg-dark-rgb), 0.5);
        }
      `}</style>
    </div>
  );
}
