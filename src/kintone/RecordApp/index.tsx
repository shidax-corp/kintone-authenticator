import React, { useEffect, useState } from 'react';

import { decodeOTPAuthURI, encodeOTPAuthURI } from '@lib/otpauth-uri';
import type { OTP } from '@lib/gen-otp';
import { generateHOTP, generateTOTP } from '@lib/gen-otp';

import KintoneLikeField from './KintoneLikeField';
import OTPField from './OTPField';
import SecretField from './SecretField';
import CopyableField from './CopyableField';
import ShowButton from './ShowButton';

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

  const [otp, setOtp] = useState<OTP | null>(null);

  const otpInfo = record.otpuri.value ? decodeOTPAuthURI(record.otpuri.value) : null;

  const updateOTP = () => {
    if (!otpInfo) {
      setOtp(null);
      return;
    }
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
    if (otpInfo) {
      updateOTP();
    }
  }, [otpInfo]);

  useEffect(() => {
    if (otp?.type === 'TOTP') {
      const timer = setTimeout(() => {
        updateOTP();
      }, otp.availableUntil.getTime() - Date.now());
      return () => clearTimeout(timer);
    }
  }, [otp]);

  const generateHOTPWithCounter = async () => {
    if (!otpInfo || otpInfo.type !== 'hotp') {
      return;
    }

    try {
      // カウンターを1増加
      const updatedOtpInfo = {
        ...otpInfo,
        counter: otpInfo.counter + 1,
      };

      // 新しいOTPAuth URIを生成
      const newOtpUri = encodeOTPAuthURI(updatedOtpInfo);

      // kintoneレコードを更新（平文で保存）
      const updatedRecord = {
        ...record,
        otpuri: { 
          type: 'SINGLE_LINE_TEXT',
          value: newOtpUri 
        },
      };

      await kintone.app.record.set({ record: updatedRecord });

      // 新しいOTPを生成
      const newOtp = await generateHOTP(updatedOtpInfo, updatedOtpInfo.counter);
      setOtp(newOtp);
    } catch (error) {
      console.error('Failed to generate HOTP with counter update:', error);
    }
  };

  return (
    <>
      <KintoneLikeField label="名前" width={width}>
        <CopyableField>{record.name.value}</CopyableField>
      </KintoneLikeField>
      <KintoneLikeField label="URL" width={width}>
        <CopyableField>{record.url.value}</CopyableField>
      </KintoneLikeField>
      {record.username.value && record.password.value && (
        <>
          <KintoneLikeField label="ユーザー名" width={width}>
            <CopyableField>{record.username.value}</CopyableField>
          </KintoneLikeField>
          <KintoneLikeField label="パスワード" width={width}>
            <SecretField value={record.password.value} />
          </KintoneLikeField>
        </>
      )}
      {record.otpuri.value && (
        <KintoneLikeField label="ワンタイムパスワード" width={width}>
          {otpInfo ? (
            otpInfo.type === 'hotp' ? (
              otp ? (
                <OTPField otp={otp} />
              ) : (
                <ShowButton onClick={() => generateHOTPWithCounter()} />
              )
            ) : (
              <OTPField otp={otp} />
            )
          ) : null}
        </KintoneLikeField>
      )}
    </>
  );
}
