import type { HashAlgorithm } from './hmac';
import type { HOTPRequest } from './gen-otp';
import { generateHOTP, generateTOTP, prettifyOTP } from './gen-otp';

describe('gen-otp', () => {
  describe('generateHOTP', () => {
    const opts: HOTPRequest = {
      secret: new Uint8Array([
        0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30, 0x31, 0x32,
        0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30,
      ]), // '12345678901234567890' in ASCII
      algorithm: 'SHA-1',
      digits: 6,
    };

    const tests = [
      { counter: 0, expected: '755224' },
      { counter: 1, expected: '287082' },
      { counter: 2, expected: '359152' },
      { counter: 3, expected: '969429' },
      { counter: 4, expected: '338314' },
      { counter: 5, expected: '254676' },
      { counter: 6, expected: '287922' },
      { counter: 7, expected: '162583' },
      { counter: 8, expected: '399871' },
      { counter: 9, expected: '520489' },
    ];

    it.each(tests)(
      'HOTP at counter $counter',
      async ({ counter, expected }) => {
        const hotp = await generateHOTP(opts, counter);
        expect(hotp.otp).toBe(expected);
        expect(hotp.timestamp).toBeInstanceOf(Date);
      }
    );

    // test values from RFC 4426 Appendix D - HOTP Algorithm: Test Values
  });

  describe('generateTOTP', () => {
    // RFC 6238 uses different secret lengths for different hash algorithms
    const secrets: Record<HashAlgorithm, Uint8Array> = {
      'SHA-1': new Uint8Array([
        0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30, 0x31, 0x32,
        0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30,
      ]), // '12345678901234567890' (20 bytes)
      'SHA-256': new Uint8Array([
        0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30, 0x31, 0x32,
        0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30, 0x31, 0x32, 0x33, 0x34,
        0x35, 0x36, 0x37, 0x38, 0x39, 0x30, 0x31, 0x32,
      ]), // '12345678901234567890123456789012' (32 bytes)
      'SHA-512': new Uint8Array([
        0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30, 0x31, 0x32,
        0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30, 0x31, 0x32, 0x33, 0x34,
        0x35, 0x36, 0x37, 0x38, 0x39, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36,
        0x37, 0x38, 0x39, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38,
        0x39, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30,
        0x31, 0x32, 0x33, 0x34,
      ]), // '1234567890123456789012345678901234567890123456789012345678901234' (64 bytes)
    };

    const tests: {
      time: number;
      algorithm: HashAlgorithm;
      expected: string;
    }[] = [
      { time: 59, algorithm: 'SHA-1', expected: '94287082' },
      { time: 59, algorithm: 'SHA-256', expected: '46119246' },
      { time: 59, algorithm: 'SHA-512', expected: '90693936' },
      { time: 1111111109, algorithm: 'SHA-1', expected: '07081804' },
      { time: 1111111109, algorithm: 'SHA-256', expected: '68084774' },
      { time: 1111111109, algorithm: 'SHA-512', expected: '25091201' },
      { time: 1111111111, algorithm: 'SHA-1', expected: '14050471' },
      { time: 1111111111, algorithm: 'SHA-256', expected: '67062674' },
      { time: 1111111111, algorithm: 'SHA-512', expected: '99943326' },
      { time: 1234567890, algorithm: 'SHA-1', expected: '89005924' },
      { time: 1234567890, algorithm: 'SHA-256', expected: '91819424' },
      { time: 1234567890, algorithm: 'SHA-512', expected: '93441116' },
      { time: 2000000000, algorithm: 'SHA-1', expected: '69279037' },
      { time: 2000000000, algorithm: 'SHA-256', expected: '90698825' },
      { time: 2000000000, algorithm: 'SHA-512', expected: '38618901' },
      { time: 20000000000, algorithm: 'SHA-1', expected: '65353130' },
      { time: 20000000000, algorithm: 'SHA-256', expected: '77737706' },
      { time: 20000000000, algorithm: 'SHA-512', expected: '47863826' },
    ];

    it.each(tests)(
      'TOTP HMAC-$algorithm at time $time',
      async ({ time, algorithm, expected }) => {
        const opts = {
          secret: secrets[algorithm],
          digits: 8,
          period: 30,
        };
        const totp = await generateTOTP({ ...opts, algorithm }, time);
        expect(totp.otp).toBe(expected);
        expect(totp.timestamp).toBeInstanceOf(Date);
      }
    );

    // test values from RFC 6238 Appendix B. Test Vectors
  });

  describe('prettifyOTP', () => {
    const tests: { otp: string; expected: string }[] = [
      { otp: '12345', expected: '123 45' },
      { otp: '123456', expected: '123 456' },
      { otp: '1234567', expected: '1234 567' },
      { otp: '12345678', expected: '1234 5678' },
      { otp: '123456789', expected: '123 456 789' },
      { otp: '1234567890', expected: '123 4567 890' },
      { otp: '12345678901', expected: '1234 5678 901' },
      { otp: '123456789012', expected: '1234 5678 9012' },
    ];

    it.each(tests)('prettifyOTP for $otp', ({ otp, expected }) => {
      expect(prettifyOTP(otp)).toBe(expected);
    });
  });
});
