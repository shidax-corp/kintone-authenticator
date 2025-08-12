const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const b32encode = (data: ArrayLike): string => {
  let output = '';
  let buffer = 0;
  let offset = 0;

  for (let i = 0; i < data.length; i++) {
    buffer = (buffer << 8) | data[i];
    offset += 8;

    while (offset >= 5) {
      offset -= 5;
      output += BASE32_ALPHABET[(buffer >> offset) & 0b00011111];
    }
  }

  if (offset > 0) {
    output += BASE32_ALPHABET[(buffer << (5 - offset)) & 0b00011111];
  }

  return output.padEnd(Math.ceil(output.length / 8) * 8, '=');
}

const b32decode = (str: string): Uint8Array => {
  const output = [];
  let buffer = 0;
  let offset = 0;

  str = str.replace(/=/g, ''); // Remove padding characters

  for (let i = 0; i < str.length; i++) {
    const char = str[i].toUpperCase();
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid Base32 character: ${char}`);
    }
    buffer = (buffer << 5) | index;
    offset += 5;

    while (offset >= 8) {
      offset -= 8;
      output.push((buffer >> offset) & 0xFF);
    }
  }

  if (offset > 0) {
    output.push((buffer << (8 - offset)) & 0xFF);
  }

  return new Uint8Array(output);
}

export type HashAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-512';

type OTPAuthRecordBase = {
  issuer: string;
  accountName: string;
  secret: Uint8Array;
  algorithm: HashAlgorithm;
  digits: number;
}

export type OTPAuthRecordHOTP = OTPAuthRecordBase & {
  type: 'hotp';
  counter: number;
}

export type OTPAuthRecordTOTP = OTPAuthRecordBase & {
  type: 'totp';
  period: number;
}

export type OTPAuthRecord = OTPAuthRecordHOTP | OTPAuthRecordTOTP;

export const encodeOTPAuthURI = ({ type, issuer, accountName, secret, algorithm, digits, period, counter }: OTPAuthRecord): string => {
  const params = new URLSearchParams({
    secret: b32encode(secret),
    issuer: encodeURIComponent(issuer),
    algorithm: algorithm.toUpperCase().replace(/-/g, ''),
    digits: digits,
  });

  if (type === 'totp' && period != null && period > 0) {
    params.append('period', period);
  }
  if (type === 'hotp') {
    params.append('counter', counter != null && counter >= 0 ? counter : 1);
  }

  const label = encodeURIComponent(`${issuer}:${accountName}`);
  return `otpauth://${type}/${label}?${params.toString()}`;
}

export const decodeOTPAuthURI = (uri: string): OTPAuthRecord => {
  const url = new URL(uri);
  const type = url.hostname;
  const label = url.pathname.slice(1);
  const [issuerByLabel, accountName] = decodeURIComponent(label).split(':');

  const secret = b32decode(url.searchParams.get('secret'));
  const issuerByParams = decodeURIComponent(url.searchParams.get('issuer') || '');
  const algorithm = url.searchParams.get('algorithm') || 'SHA1';
  const digits = parseInt(url.searchParams.get('digits'), 10) || 6;
  const period = parseInt(url.searchParams.get('period'), 10) || 30;
  const counter = parseInt(url.searchParams.get('counter'), 10) || 1;

  const issuer = issuerByParams || issuerByLabel;

  return {
    type,
    issuer,
    accountName,
    secret,
    algorithm: {
      'SHA1': 'SHA-1',
      'SHA256': 'SHA-256',
      'SHA512': 'SHA-512',
    }[algorithm.toUpperCase()] || algorithm,
    digits,
    period: type === 'totp' ? period : undefined,
    counter: type === 'hotp' ? counter : undefined,
  };
}
