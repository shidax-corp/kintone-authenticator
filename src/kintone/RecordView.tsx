import React, { useEffect, useState } from 'react';

import { decodeOTPAuthURI } from '@lib/otpauth-uri';
import type { OTP } from '@lib/gen-otp';
import { generateHOTP, generateTOTP } from '@lib/gen-otp';

export interface RecordViewProps {
  appId: number;
  recordId: number;
  record: kintone.types.SavedFields;
}

export default function RecordView({ record }: RecordViewProps) {
  useEffect(() => {
    kintone.app.record.setFieldShown('uri', false);
  }, []);

  const otpInfo = decodeOTPAuthURI(record.uri.value);

  let [otp, setOtp] = useState<OTP | null>(null);
  useEffect(() => {
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
  }, [otpInfo]);

  return (
    <div className="control-gaia control-single_line_text-field-gaia field-2020 control-show-gaia">
      <div className="control-label-gaia label-2020">
        <span className="control-label-text-gaia">ワンタイムパスワード</span>
      </div>
      <div className="control-value-gaia value-2020">
        <span className="control-value-content-gaia">{!otp ? 'loading...' : otp.otp}</span>
      </div>
      <div className="control-design-gaia"></div>
    </div>
  );
}
