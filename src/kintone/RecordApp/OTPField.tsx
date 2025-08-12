import React, { useState, useEffect } from 'react';

import type { OTP } from '@lib/gen-otp';
import { prettifyOTP } from '@lib/gen-otp';

import CopyBlock from './CopyBlock';

export interface OTPFieldProps {
  otp: OTP | null;
  barOffset?: { x?: string; y?: string; };
}

export default function OTPField({ otp, barOffset }: OTPFieldProps) {
  if (!otp) {
    return <div className="otp-display">OTPの生成に失敗しました。</div>;
  }

  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (otp?.type === 'TOTP') {
      let running = true;

      const updateRemaining = () => {
        if (!running) return;

        const timeLeft = otp.availableUntil.getTime() - Date.now();
        const duration = otp.availableUntil.getTime() - otp.availableFrom.getTime();
        setRemaining(Math.max(0, timeLeft / duration * 100));

        requestAnimationFrame(updateRemaining);
      };
      updateRemaining();

      return () => {
        running = false;
      };
    }
  }, [otp]);

  return (
    <div style={{ position: 'relative', fontSize: '140%' }}>
      <CopyBlock style={{ padding: '4px 8px 8px' }}>{!otp ? 'loading...' : prettifyOTP(otp.otp)}</CopyBlock>

      {otp?.type === 'TOTP' && (
        <div style={{ position: 'absolute', left: barOffset?.x ?? 0, bottom: barOffset?.y ?? 0, right: barOffset?.x ?? 0, height: '4px', backgroundColor: '#0003' }}>
          <div style={{ position: 'absolute', left: barOffset?.x ?? 0, bottom: barOffset?.y ?? 0, height: '100%', backgroundColor: '#0009', width: `${100 - remaining}%` }}></div>
        </div>
      )}
    </div>
  );
}
