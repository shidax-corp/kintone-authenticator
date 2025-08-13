import type { HashAlgorithm } from './hmac';
import { b32encode, b32decode } from './base32';

type OTPAuthRecordBase = {
  issuer: string;
  accountName: string;
  secret: Uint8Array;
  algorithm: HashAlgorithm;
  digits: number;
};

export type OTPAuthRecordHOTP = OTPAuthRecordBase & {
  type: 'hotp';
  counter: number;
};

export type OTPAuthRecordTOTP = OTPAuthRecordBase & {
  type: 'totp';
  period: number;
};

export type OTPAuthRecord = OTPAuthRecordHOTP | OTPAuthRecordTOTP;

export const encodeOTPAuthURI = (record: OTPAuthRecord): string => {
  const { type, issuer, accountName, secret, algorithm, digits } = record;
  const params = new URLSearchParams({
    secret: b32encode(secret),
    issuer: encodeURIComponent(issuer),
    algorithm: algorithm.toUpperCase().replace(/-/g, ''),
    digits: digits.toString(),
  });

  if (
    type === 'totp' &&
    record.type === 'totp' &&
    record.period != null &&
    record.period > 0
  ) {
    params.append('period', record.period.toString());
  }
  if (type === 'hotp' && record.type === 'hotp') {
    params.append(
      'counter',
      (record.counter != null && record.counter >= 0
        ? record.counter
        : 1
      ).toString()
    );
  }

  const label = encodeURIComponent(`${issuer}:${accountName}`);
  return `otpauth://${type}/${label}?${params.toString()}`;
};

export const decodeOTPAuthURI = (uri: string): OTPAuthRecord => {
  const url = new URL(uri);
  const type = url.hostname;
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

  if (type === 'totp') {
    return {
      type: 'totp' as const,
      issuer,
      accountName,
      secret,
      algorithm: normalizedAlgorithm,
      digits,
      period,
    };
  } else {
    return {
      type: 'hotp' as const,
      issuer,
      accountName,
      secret,
      algorithm: normalizedAlgorithm,
      digits,
      counter,
    };
  }
};
