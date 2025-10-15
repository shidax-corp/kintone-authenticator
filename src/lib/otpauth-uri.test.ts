import { b32decode } from './base32';
import { decodeOTPAuthURI, encodeOTPAuthURI } from './otpauth-uri';

describe('otpauth-uri', () => {
  describe('encodeOTPAuthURI', () => {
    it('should not double-encode issuer with spaces', () => {
      const secret = new Uint8Array([
        0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30,
      ]);

      const record = {
        type: 'TOTP' as const,
        issuer: 'ACME Inc',
        accountName: 'user@example.com',
        secret,
        algorithm: 'SHA-1' as const,
        digits: 6,
        period: 30,
      };

      const uri = encodeOTPAuthURI(record);

      // issuerパラメータが一度だけエンコードされていることを確認
      expect(uri).toContain('issuer=ACME%20Inc');
      // 二重エンコードされていないことを確認（%2520は二重エンコードの証拠）
      expect(uri).not.toContain('issuer=ACME%2520Inc');
    });

    it('should not double-encode issuer with special characters', () => {
      const secret = new Uint8Array([
        0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30,
      ]);

      const record = {
        type: 'TOTP' as const,
        issuer: 'ACME & Co.',
        accountName: 'user@example.com',
        secret,
        algorithm: 'SHA-1' as const,
        digits: 6,
        period: 30,
      };

      const uri = encodeOTPAuthURI(record);

      // issuerパラメータが正しくエンコードされていることを確認
      expect(uri).toContain('issuer=ACME%20%26%20Co.');
      // 二重エンコードされていないことを確認
      expect(uri).not.toContain('%2526'); // &の二重エンコード
    });

    it('should encode and decode issuer correctly', () => {
      const secret = new Uint8Array([
        0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30,
      ]);

      const originalRecord = {
        type: 'TOTP' as const,
        issuer: 'ACME Inc',
        accountName: 'user@example.com',
        secret,
        algorithm: 'SHA-1' as const,
        digits: 6,
        period: 30,
      };

      const uri = encodeOTPAuthURI(originalRecord);
      const decodedRecord = decodeOTPAuthURI(uri);

      // デコード後、issuer名が元の文字列と一致することを確認
      expect(decodedRecord.issuer).toBe('ACME Inc');
      // 二重エンコードの痕跡がないことを確認
      expect(decodedRecord.issuer).not.toContain('%20');
    });

    it('should handle HOTP with issuer containing spaces', () => {
      const secret = new Uint8Array([
        0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30,
      ]);

      const record = {
        type: 'HOTP' as const,
        issuer: 'Test Service',
        accountName: 'user123',
        secret,
        algorithm: 'SHA-256' as const,
        digits: 8,
        counter: 5,
      };

      const uri = encodeOTPAuthURI(record);

      // issuerパラメータが一度だけエンコードされていることを確認
      expect(uri).toContain('issuer=Test%20Service');
      // 二重エンコードされていないことを確認
      expect(uri).not.toContain('issuer=Test%2520Service');

      const decodedRecord = decodeOTPAuthURI(uri);
      expect(decodedRecord.issuer).toBe('Test Service');
    });
  });

  describe('decodeOTPAuthURI', () => {
    it('should decode TOTP URI correctly', () => {
      const uri =
        'otpauth://totp/Example:user@example.com?secret=GEZDGNBVGY3TQOJQ&issuer=Example&algorithm=SHA1&digits=6&period=30';
      const record = decodeOTPAuthURI(uri);

      expect(record.type).toBe('TOTP');
      expect(record.issuer).toBe('Example');
      expect(record.accountName).toBe('user@example.com');
      expect(record.algorithm).toBe('SHA-1');
      expect(record.digits).toBe(6);
      if (record.type === 'TOTP') {
        expect(record.period).toBe(30);
      }
    });

    it('should decode HOTP URI correctly', () => {
      const uri =
        'otpauth://hotp/Example:user@example.com?secret=GEZDGNBVGY3TQOJQ&issuer=Example&algorithm=SHA1&digits=6&counter=1';
      const record = decodeOTPAuthURI(uri);

      expect(record.type).toBe('HOTP');
      expect(record.issuer).toBe('Example');
      expect(record.accountName).toBe('user@example.com');
      expect(record.algorithm).toBe('SHA-1');
      expect(record.digits).toBe(6);
      if (record.type === 'HOTP') {
        expect(record.counter).toBe(1);
      }
    });
  });

  describe('round-trip encoding/decoding', () => {
    it('should preserve all fields for TOTP', () => {
      const originalRecord = {
        type: 'TOTP' as const,
        issuer: 'GitHub',
        accountName: 'octocat',
        secret: b32decode('JBSWY3DPEHPK3PXP'),
        algorithm: 'SHA-256' as const,
        digits: 8,
        period: 60,
      };

      const uri = encodeOTPAuthURI(originalRecord);
      const decodedRecord = decodeOTPAuthURI(uri);

      expect(decodedRecord).toEqual(originalRecord);
    });

    it('should preserve all fields for HOTP', () => {
      const originalRecord = {
        type: 'HOTP' as const,
        issuer: 'Google',
        accountName: 'test@gmail.com',
        secret: b32decode('JBSWY3DPEHPK3PXP'),
        algorithm: 'SHA-512' as const,
        digits: 7,
        counter: 10,
      };

      const uri = encodeOTPAuthURI(originalRecord);
      const decodedRecord = decodeOTPAuthURI(uri);

      expect(decodedRecord).toEqual(originalRecord);
    });
  });
});
