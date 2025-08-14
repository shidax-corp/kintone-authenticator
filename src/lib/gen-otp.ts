/** ワンタイムパスワードを生成する
 *
 * https://qiita.com/kerupani129/items/4780fb1eea160c7a00bd
 */

import type { HashAlgorithm } from './hmac';
import { hmac } from './hmac';

/** Truncates the last byte of the data to extract a 32-bit integer.
 *
 * This is defined by [the RFC 4226](https://datatracker.ietf.org/doc/html/rfc4226#section-5.3).
 */
const dynamicTruncate = (data: Uint8Array): number => {
  const offset = data[data.length - 1] & 0x0f;

  const code =
    ((data[offset + 0] & 0x7f) << 24) |
    (data[offset + 1] << 16) |
    (data[offset + 2] << 8) |
    (data[offset + 3] << 0);

  return code & 0x7fff_ffff; // Ensure it's a positive integer
};

export type HOTPRequest = {
  secret: Uint8Array;
  algorithm: HashAlgorithm;
  digits: number;
};

export type HOTP = {
  type: 'HOTP';
  otp: string;
  timestamp: Date;
};

/** Generates a one-time password (HOTP) based on the given seed and counter.
 *
 * This is defined by [the RFC 4226](https://datatracker.ietf.org/doc/html/rfc4226).
 */
export const generateHOTP = async (
  { secret, algorithm, digits }: HOTPRequest,
  counter: number
): Promise<HOTP> => {
  const digest = await hmac(secret, counter, algorithm);
  const otp = dynamicTruncate(digest) % Math.pow(10, digits);
  return {
    type: 'HOTP',
    otp: otp.toString().padStart(digits, '0'),
    timestamp: new Date(),
  };
};

export type TOTPRequest = {
  secret: Uint8Array;
  algorithm: HashAlgorithm;
  digits: number;
  period?: number;
};

export type TOTP = {
  type: 'TOTP';
  otp: string;
  timestamp: Date;
  availableFrom: Date;
  availableUntil: Date;
};

/** Generates a time-based one-time password (TOTP) based on the given secret.
 */
export const generateTOTP = async (
  { secret, algorithm = 'SHA-1', digits = 6, period = 30 }: TOTPRequest,
  currentTime: number | null = null
): Promise<TOTP> => {
  if (currentTime === null) {
    currentTime = Math.floor(Date.now() / 1000);
  }

  const counter = Math.floor(currentTime / period);
  const { otp } = await generateHOTP({ secret, algorithm, digits }, counter);

  return {
    type: 'TOTP',
    otp,
    timestamp: new Date(currentTime * 1000),
    availableFrom: new Date(counter * period * 1000),
    availableUntil: new Date((counter * period + period) * 1000),
  };
};

export type OTP = HOTP | TOTP;

export const prettifyOTP = (otp: string): string => {
  if (otp.length === 5) {
    return otp.replace(/(\d{3})(\d{2})/, '$1 $2');
  }
  if (otp.length === 6) {
    return otp.replace(/(\d{3})(\d{3})/, '$1 $2');
  } else if (otp.length === 7) {
    return otp.replace(/(\d{4})(\d{3})/, '$1 $2');
  } else if (otp.length === 8) {
    return otp.replace(/(\d{4})(\d{4})/, '$1 $2');
  } else if (otp.length === 9) {
    return otp.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  } else if (otp.length === 10) {
    return otp.replace(/(\d{3})(\d{4})(\d{3})/, '$1 $2 $3');
  } else if (otp.length === 11) {
    return otp.replace(/(\d{4})(\d{4})(\d{3})/, '$1 $2 $3');
  } else if (otp.length === 12) {
    return otp.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
  }
  return otp; // Return as is for other lengths
};
