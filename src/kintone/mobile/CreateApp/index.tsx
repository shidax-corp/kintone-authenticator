import { useState } from 'react';

import type { OTPAuthRecord } from '@lib/otpauth-uri';

import Scanner from './Scanner';

export default function CreateApp() {
  const [uri, setUri] = useState<string>('');

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

  const onScanned = (u: string, info: OTPAuthRecord) => {
    setFieldValue('otpuri', u);
    setUri(u);

    setFieldValue('name', info.issuer || '');
    setFieldValue('username', info.accountName || '');
  };

  if (!uri) {
    return <Scanner onRead={onScanned} />;
  }

  return <></>;
}
