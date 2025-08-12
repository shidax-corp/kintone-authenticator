import React, { useEffect, useState } from 'react';

import { decodeOTPAuthURI } from '@lib/otpauth-uri';
import type { OTP } from '@lib/gen-otp';
import { generateHOTP, generateTOTP } from '@lib/gen-otp';

import KintoneLikeField from './KintoneLikeField';
import OTPField from './OTPField';
import SecretField from './SecretField';
import CopyableField from './CopyableField';

export interface RecordAppProps {
  appId: number;
  recordId: number;
  record: kintone.types.SavedFields;
}

export default function RecordApp({ record }: RecordAppProps) {
  const width = kintone.app.record.getFieldElement('name')?.parentElement?.style?.width ?? '100%';
  useEffect(() => {
    kintone.app.record.setFieldShown('name', false);
    kintone.app.record.setFieldShown('url', false);
    kintone.app.record.setFieldShown('username', false);
    kintone.app.record.setFieldShown('password', false);
    kintone.app.record.setFieldShown('otpuri', false);
  }, []);

  const otpInfo = decodeOTPAuthURI(record.otpuri.value);

  const [otp, setOtp] = useState<OTP | null>(null);
  const updateOTP = () => {
    (otpInfo.type === 'totp' ? (
      generateTOTP(otpInfo)
    ) : (
      generateHOTP(otpInfo, otpInfo.counter)
    )).then((generatedOtp) => {
      setOtp(generatedOtp);
    }).catch((error) => {
      console.error('Failed to generate OTP:', error);
      setOtp(null);
    });
  };
  useEffect(() => {
    updateOTP();
  }, []);

  useEffect(() => {
    if (otp?.type === 'TOTP') {
      const timer = setTimeout(() => {
        updateOTP();
      }, otp.availableUntil.getTime() - Date.now());
      return () => clearTimeout(timer);
    }
  }, [otp]);

  return (
    <>
      <KintoneLikeField label="名前" width={width}>
        <CopyableField>{record.name.value}</CopyableField>
      </KintoneLikeField>
      <KintoneLikeField label="URL" width={width}>
        <CopyableField>{record.url.value}</CopyableField>
      </KintoneLikeField>
      <KintoneLikeField label="ユーザー名" width={width}>
        <CopyableField>{record.username.value}</CopyableField>
      </KintoneLikeField>
      <KintoneLikeField label="パスワード" width={width}>
        <SecretField value={record.password.value} />
      </KintoneLikeField>
      <KintoneLikeField label="ワンタイムパスワード" width={width}>
        <OTPField otp={otp} />
      </KintoneLikeField>
    </>
  );
}
