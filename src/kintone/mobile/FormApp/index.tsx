import { useEffect, useState } from 'react';

import type { OTPAuthRecord } from '@lib/otpauth-uri';

import OTPInputField from './OTPInputField';

export type FormAppProps = {
  record?: kintone.types.Fields;
};

export default function FormApp({ record }: FormAppProps) {
  const [otpuri, setOtpuri] = useState(record?.otpuri.value || '');

  useEffect(() => {
    kintone.mobile.app.record.setFieldShown('otpuri', false);
  }, []);

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
    setOtpuri(u);

    setFieldValue('name', info.issuer || '');
    setFieldValue('username', info.accountName || '');
  };

  return (
    <div>
      <OTPInputField
        uri={otpuri}
        onScanned={onScanned}
        openScannerByDefault={record == null}
      />
    </div>
  );
}
