import { b32decode, b32encode } from './base32';
import { generateHOTP, generateTOTP } from './gen-otp';
import type { HashAlgorithm } from './hmac';

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
  return `otpauth://${record.type.toLowerCase()}/${label}?${params.toString()}`;
};

const parseURL = (uri: string): URL => {
  try {
    return new URL(uri);
  } catch {
    throw new Error('データ形式が正しくありません');
  }
};

export const decodeOTPAuthURI = (uri: string): OTPAuthRecord => {
  const url = parseURL(uri);
  const type = url.hostname.toUpperCase();
  const label = decodeURIComponent(url.pathname.slice(1));
  const [issuerByLabel, accountName] = label.includes(':')
    ? label.split(':', 2)
    : ['', label];

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
  } else if (type === 'HOTP') {
    return {
      type: 'HOTP' as const,
      issuer,
      accountName,
      secret,
      algorithm: normalizedAlgorithm,
      digits,
      counter,
    };
  } else {
    throw new Error(`${type}形式はサポートされていません`);
  }
};

export const isValidOTPAuthURI = async (uri: string): Promise<boolean> => {
  try {
    const otp = decodeOTPAuthURI(uri);
    if (otp.type === 'HOTP') {
      await generateHOTP(otp, otp.counter);
    } else {
      await generateTOTP(otp);
    }
  } catch {
    return false;
  }
  return true;
};
