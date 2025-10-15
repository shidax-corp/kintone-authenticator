import { b32encode } from './base32';
import { decodeOTPAuthURI, encodeOTPAuthURI } from './otpauth-uri';

describe('otpauth-uri', () => {
  describe('decodeOTPAuthURI', () => {
    describe('HOTP counter handling', () => {
      const secret = new Uint8Array([
        0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30,
      ]);
      const secretBase32 = b32encode(secret);

      it('counter=0を正しく保持する', () => {
        const uri = `otpauth://hotp/Test:user@example.com?secret=${secretBase32}&issuer=Test&counter=0`;
        const result = decodeOTPAuthURI(uri);

        expect(result.type).toBe('HOTP');
        if (result.type === 'HOTP') {
          expect(result.counter).toBe(0);
        }
      });

      it('counter=1を正しく保持する', () => {
        const uri = `otpauth://hotp/Test:user@example.com?secret=${secretBase32}&issuer=Test&counter=1`;
        const result = decodeOTPAuthURI(uri);

        expect(result.type).toBe('HOTP');
        if (result.type === 'HOTP') {
          expect(result.counter).toBe(1);
        }
      });

      it('counter=5を正しく保持する', () => {
        const uri = `otpauth://hotp/Test:user@example.com?secret=${secretBase32}&issuer=Test&counter=5`;
        const result = decodeOTPAuthURI(uri);

        expect(result.type).toBe('HOTP');
        if (result.type === 'HOTP') {
          expect(result.counter).toBe(5);
        }
      });

      it('counterが指定されていない場合はデフォルト値1を使用する', () => {
        const uri = `otpauth://hotp/Test:user@example.com?secret=${secretBase32}&issuer=Test`;
        const result = decodeOTPAuthURI(uri);

        expect(result.type).toBe('HOTP');
        if (result.type === 'HOTP') {
          expect(result.counter).toBe(1);
        }
      });

      it('counterが負の値の場合はデフォルト値1を使用する', () => {
        const uri = `otpauth://hotp/Test:user@example.com?secret=${secretBase32}&issuer=Test&counter=-1`;
        const result = decodeOTPAuthURI(uri);

        expect(result.type).toBe('HOTP');
        if (result.type === 'HOTP') {
          expect(result.counter).toBe(1);
        }
      });

      it('counterが無効な値の場合はデフォルト値1を使用する', () => {
        const uri = `otpauth://hotp/Test:user@example.com?secret=${secretBase32}&issuer=Test&counter=invalid`;
        const result = decodeOTPAuthURI(uri);

        expect(result.type).toBe('HOTP');
        if (result.type === 'HOTP') {
          expect(result.counter).toBe(1);
        }
      });
    });
  });

  describe('encodeOTPAuthURI', () => {
    describe('HOTP counter encoding', () => {
      it('counter=0を正しくエンコードする', () => {
        const record = {
          type: 'HOTP' as const,
          issuer: 'Test',
          accountName: 'user@example.com',
          secret: new Uint8Array([
            0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30,
          ]),
          algorithm: 'SHA-1' as const,
          digits: 6,
          counter: 0,
        };

        const uri = encodeOTPAuthURI(record);
        expect(uri).toContain('counter=0');
      });

      it('counter=1を正しくエンコードする', () => {
        const record = {
          type: 'HOTP' as const,
          issuer: 'Test',
          accountName: 'user@example.com',
          secret: new Uint8Array([
            0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30,
          ]),
          algorithm: 'SHA-1' as const,
          digits: 6,
          counter: 1,
        };

        const uri = encodeOTPAuthURI(record);
        expect(uri).toContain('counter=1');
      });
    });
  });

  describe('encode and decode round-trip', () => {
    it('HOTP counter=0のラウンドトリップ', () => {
      const original = {
        type: 'HOTP' as const,
        issuer: 'Test',
        accountName: 'user@example.com',
        secret: new Uint8Array([
          0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30,
        ]),
        algorithm: 'SHA-1' as const,
        digits: 6,
        counter: 0,
      };

      const uri = encodeOTPAuthURI(original);
      const decoded = decodeOTPAuthURI(uri);

      expect(decoded.type).toBe('HOTP');
      if (decoded.type === 'HOTP') {
        expect(decoded.counter).toBe(0);
        expect(decoded.issuer).toBe(original.issuer);
        expect(decoded.accountName).toBe(original.accountName);
        expect(decoded.algorithm).toBe(original.algorithm);
        expect(decoded.digits).toBe(original.digits);
      }
    });
  });
});
