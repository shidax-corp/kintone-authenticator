import type { HashAlgorithm } from './hmac';
import { b32encode, b32decode } from './base32';

type OTPAuthRecordBase = {
  issuer: string;
  accountName: string;
  secret: Uint8Array;
  algorithm: HashAlgorithm;
  digits: number;
};

export type OTPAuthRecordHOTP = Readonly<
  OTPAuthRecordBase & {
    type: 'HOTP';
    counter: number;
  }
>;

export type OTPAuthRecordTOTP = Readonly<
  OTPAuthRecordBase & {
    type: 'TOTP';
    period: number;
  }
>;

export type OTPAuthRecord = Readonly<OTPAuthRecordHOTP | OTPAuthRecordTOTP>;

export const encodeOTPAuthURI = (record: OTPAuthRecord): string => {
  const params = new URLSearchParams({
    secret: b32encode(record.secret),
    issuer: encodeURIComponent(record.issuer),
    algorithm: record.algorithm.toUpperCase().replace(/-/g, ''),
    digits: record.digits.toString(),
  });

  if (record.type === 'TOTP' && record.period != null && record.period > 0) {
    params.append('period', record.period.toString());
  }
  if (record.type === 'HOTP') {
    params.append(
      'counter',
      (record.counter != null && record.counter >= 0
        ? record.counter
        : 1
      ).toString()
    );
  }

  const label = encodeURIComponent(`${record.issuer}:${record.accountName}`);
  return `otpauth://${record.type}/${label}?${params.toString()}`;
};

export const decodeOTPAuthURI = (uri: string): OTPAuthRecord => {
  const url = new URL(uri);
  const type = url.hostname.toUpperCase();
  const label = url.pathname.slice(1);
  const [issuerByLabel, accountName] = decodeURIComponent(label).split(':');

  const secret = b32decode(url.searchParams.get('secret') || '');
  const issuerByParams = decodeURIComponent(
    url.searchParams.get('issuer') || ''
  );
  const algorithm = url.searchParams.get('algorithm') || 'SHA1';
  const digits = parseInt(url.searchParams.get('digits') || '6', 10) || 6;
  const period = parseInt(url.searchParams.get('period') || '30', 10) || 30;
  const counter = parseInt(url.searchParams.get('counter') || '1', 10) || 1;

  const issuer = issuerByParams || issuerByLabel;

  const algorithmMap: { [key: string]: HashAlgorithm } = {
    SHA1: 'SHA-1',
    SHA256: 'SHA-256',
    SHA512: 'SHA-512',
  };
  const normalizedAlgorithm = algorithmMap[algorithm.toUpperCase()] || 'SHA-1';

  if (type === 'TOTP') {
    return {
      type: 'TOTP' as const,
      issuer,
      accountName,
      secret,
      algorithm: normalizedAlgorithm,
      digits,
      period,
    };
  } else {
    return {
      type: 'HOTP' as const,
      issuer,
      accountName,
      secret,
      algorithm: normalizedAlgorithm,
      digits,
      counter,
    };
  }
};
