import React, { useEffect, useState } from 'react';

import { decodeOTPAuthURI, encodeOTPAuthURI } from '@lib/otpauth-uri';
import type { OTP } from '@lib/gen-otp';
import { generateHOTP, generateTOTP } from '@lib/gen-otp';
import { decryptRecordData, type DecryptedRecordData } from '../lib/decrypt-record-data';
import { PassphraseManager } from '../lib/passphrase-manager';
import { encrypt } from '@lib/crypto';

import KintoneLikeField from './KintoneLikeField';
import OTPField from './OTPField';
import SecretField from './SecretField';
import CopyableField from './CopyableField';
import PassphraseDialog from './PassphraseDialog';
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

  const [decryptedData, setDecryptedData] = useState<DecryptedRecordData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [otp, setOtp] = useState<OTP | null>(null);
  // 初期化時に復号を試行
  useEffect(() => {
    const initializeDecryption = async () => {
      const data = await decryptRecordData(record);
      setDecryptedData(data);
    };
    initializeDecryption();
  }, [record]);

  const otpInfo = decryptedData?.otpuri ? decodeOTPAuthURI(decryptedData.otpuri) : null;

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
    if (decryptedData?.isDecrypted && otpInfo) {
      updateOTP();
    }
  }, [decryptedData, otpInfo]);

  useEffect(() => {
    if (otp?.type === 'TOTP') {
      const timer = setTimeout(() => {
        updateOTP();
      }, otp.availableUntil.getTime() - Date.now());
      return () => clearTimeout(timer);
    }
  }, [otp]);

  const handlePassphraseSubmit = async (passphrase: string) => {
    PassphraseManager.save(passphrase);
    const data = await decryptRecordData(record);
    setDecryptedData(data);
    setIsDialogOpen(false);
  };

  const handleShowButtonClick = () => {
    setIsDialogOpen(true);
  };

  const generateHOTPWithCounter = async () => {
    if (!decryptedData?.isDecrypted || !otpInfo || otpInfo.type !== 'hotp') {
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

      // パスフレーズを取得して暗号化
      const passphrase = PassphraseManager.get();
      if (!passphrase) {
        console.error('Passphrase not found');
        return;
      }

      const encryptedOtpUri = await encrypt(newOtpUri, passphrase);

      // kintoneレコードを更新
      const updatedRecord = {
        ...record,
        otpuri: { value: encryptedOtpUri },
      };

      await kintone.app.record.set(updatedRecord);

      // 新しいOTPを生成
      const newOtp = await generateHOTP(updatedOtpInfo, updatedOtpInfo.counter);
      setOtp(newOtp);

      // decryptedDataも更新
      setDecryptedData({
        ...decryptedData,
        otpuri: newOtpUri,
      });
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
      {decryptedData && record.username.value && record.password.value && (
        <>
          <KintoneLikeField label="ユーザー名" width={width}>
            <CopyableField>{decryptedData.username}</CopyableField>
          </KintoneLikeField>
          <KintoneLikeField label="パスワード" width={width}>
            {decryptedData.isDecrypted ? (
              <SecretField value={decryptedData.password} />
            ) : (
              <ShowButton onClick={handleShowButtonClick} />
            )}
          </KintoneLikeField>
        </>
      )}
      {decryptedData && record.otpuri.value && (
        <KintoneLikeField label="ワンタイムパスワード" width={width}>
          {decryptedData.isDecrypted && otpInfo ? (
            otpInfo.type === 'hotp' ? (
              otp ? (
                <OTPField otp={otp} />
              ) : (
                <ShowButton onClick={() => generateHOTPWithCounter()} />
              )
            ) : (
              <OTPField otp={otp} />
            )
          ) : (
            <ShowButton onClick={handleShowButtonClick} />
          )}
        </KintoneLikeField>
      )}
      <PassphraseDialog
        isOpen={isDialogOpen}
        onConfirm={handlePassphraseSubmit}
        onCancel={() => setIsDialogOpen(false)}
      />
    </>
  );
}
