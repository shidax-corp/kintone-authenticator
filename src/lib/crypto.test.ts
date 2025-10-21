import { decrypt, encrypt, isEncrypted } from './crypto';

describe('crypto', () => {
  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt a string correctly', async () => {
      const data = 'Hello, World!';
      const pin = '1234';

      const encrypted = await encrypt(data, pin);
      const decrypted = await decrypt(encrypted, pin);

      expect(decrypted).toBe(data);
    });

    it('should handle multiple strings correctly', async () => {
      const testCases = [
        { data: 'test', pin: 'pin123' },
        { data: 'another test string', pin: 'secretPIN' },
        { data: '1234567890', pin: '0000' },
      ];

      for (const { data, pin } of testCases) {
        const encrypted = await encrypt(data, pin);
        const decrypted = await decrypt(encrypted, pin);
        expect(decrypted).toBe(data);
      }
    });

    it('should handle empty string', async () => {
      const data = '';
      const pin = '1234';

      const encrypted = await encrypt(data, pin);
      const decrypted = await decrypt(encrypted, pin);

      expect(decrypted).toBe(data);
    });

    it('should handle Japanese characters', async () => {
      const data = 'こんにちは世界！🌏';
      const pin = 'パスワード123';

      const encrypted = await encrypt(data, pin);
      const decrypted = await decrypt(encrypted, pin);

      expect(decrypted).toBe(data);
    });

    it('should handle long strings', async () => {
      const data = 'A'.repeat(10000); // 10KB string
      const pin = 'longStringPin';

      const encrypted = await encrypt(data, pin);
      const decrypted = await decrypt(encrypted, pin);

      expect(decrypted).toBe(data);
    });
  });

  describe('encryption format', () => {
    it('should produce correctly formatted encrypted data', async () => {
      const data = 'test data';
      const pin = '1234';

      const encrypted = await encrypt(data, pin);

      // Check format: encrypted:{iv}.{salt}.{ciphertext}
      expect(encrypted.startsWith('encrypted:')).toBe(true);

      const dataWithoutPrefix = encrypted.substring('encrypted:'.length);
      const parts = dataWithoutPrefix.split('.');
      expect(parts).toHaveLength(3);

      // Check that each part is valid base64
      parts.forEach((part) => {
        expect(() => Buffer.from(part, 'base64')).not.toThrow();
      });

      // Check sizes after decoding
      const iv = Buffer.from(parts[0], 'base64');
      const salt = Buffer.from(parts[1], 'base64');

      expect(iv.length).toBe(12); // IV should be 12 bytes for AES-GCM
      expect(salt.length).toBe(16); // Salt should be 16 bytes
    });

    it('should produce different encrypted data for same input', async () => {
      const data = 'test data';
      const pin = '1234';

      const encrypted1 = await encrypt(data, pin);
      const encrypted2 = await encrypt(data, pin);

      // Should be different due to random IV and salt
      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to the same value
      const decrypted1 = await decrypt(encrypted1, pin);
      const decrypted2 = await decrypt(encrypted2, pin);

      expect(decrypted1).toBe(data);
      expect(decrypted2).toBe(data);
    });
  });

  describe('error cases', () => {
    it('should fail to decrypt with wrong PIN', async () => {
      const data = 'secret data';
      const correctPin = '1234';
      const wrongPin = '5678';

      const encrypted = await encrypt(data, correctPin);

      await expect(decrypt(encrypted, wrongPin)).rejects.toThrow();
    });

    it('should fail to decrypt invalid format', async () => {
      const pin = '1234';

      // Missing 'encrypted:' prefix
      await expect(decrypt('invalid.format.data', pin)).rejects.toThrow(
        'Invalid encrypted data format'
      );

      // Not enough parts (with prefix)
      await expect(decrypt('encrypted:invalid.format', pin)).rejects.toThrow(
        'Invalid encrypted data format'
      );

      // Too many parts (with prefix)
      await expect(
        decrypt('encrypted:too.many.parts.here', pin)
      ).rejects.toThrow('Invalid encrypted data format');

      // Single string
      await expect(decrypt('invaliddata', pin)).rejects.toThrow(
        'Invalid encrypted data format'
      );

      // Prefix only
      await expect(decrypt('encrypted:', pin)).rejects.toThrow(
        'Invalid encrypted data format'
      );
    });

    it('should fail to decrypt invalid base64', async () => {
      const pin = '1234';

      // Invalid base64 in different parts (with prefix)
      await expect(
        decrypt('encrypted:invalid!.base64.data', pin)
      ).rejects.toThrow();
      await expect(
        decrypt('encrypted:dmFsaWQ=.invalid!.data', pin)
      ).rejects.toThrow();
      await expect(
        decrypt('encrypted:dmFsaWQ=.dmFsaWQ=.invalid!', pin)
      ).rejects.toThrow();
    });

    it('should fail to decrypt corrupted data', async () => {
      const data = 'test data';
      const pin = '1234';

      const encrypted = await encrypt(data, pin);
      const dataWithoutPrefix = encrypted.substring('encrypted:'.length);
      const parts = dataWithoutPrefix.split('.');

      // Corrupt the ciphertext by changing some characters
      const corruptedCiphertext =
        parts[2].substring(0, parts[2].length - 4) + 'XXXX';
      const corrupted = `encrypted:${parts[0]}.${parts[1]}.${corruptedCiphertext}`;

      await expect(decrypt(corrupted, pin)).rejects.toThrow();
    });
  });

  describe('special characters and edge cases', () => {
    it('should handle special characters in data', async () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;\':",./<>?`~\n\t\r';
      const pin = 'test123';

      const encrypted = await encrypt(specialChars, pin);
      const decrypted = await decrypt(encrypted, pin);

      expect(decrypted).toBe(specialChars);
    });

    it('should handle special characters in PIN', async () => {
      const data = 'test data';
      const specialPin = '!@#$%^&*()_+日本語';

      const encrypted = await encrypt(data, specialPin);
      const decrypted = await decrypt(encrypted, specialPin);

      expect(decrypted).toBe(data);
    });

    it('should handle very long PIN', async () => {
      const data = 'test data';
      const longPin = 'x'.repeat(1000);

      const encrypted = await encrypt(data, longPin);
      const decrypted = await decrypt(encrypted, longPin);

      expect(decrypted).toBe(data);
    });
  });

  describe('isEncrypted', () => {
    it('should return true for encrypted data', async () => {
      const data = 'test data';
      const pin = '1234';

      const encrypted = await encrypt(data, pin);

      expect(isEncrypted(encrypted)).toBe(true);
    });

    it('should return false for non-encrypted data', () => {
      expect(isEncrypted('plain text')).toBe(false);
      expect(isEncrypted('data.with.dots')).toBe(false);
      expect(isEncrypted('')).toBe(false);
    });

    it('should return false for data without encrypted prefix', () => {
      // Data has correct format but missing prefix
      expect(isEncrypted('aaa.bbb.ccc')).toBe(false);
    });

    it('should return false for data with prefix but wrong format', () => {
      // Has prefix but wrong number of parts
      expect(isEncrypted('encrypted:aaa.bbb')).toBe(false);
      expect(isEncrypted('encrypted:aaa.bbb.ccc.ddd')).toBe(false);
      expect(isEncrypted('encrypted:')).toBe(false);
    });

    it('should return true only for correct format', () => {
      // Correct format: encrypted: prefix + 3 parts with valid base64
      expect(isEncrypted('encrypted:aaa.bbb.ccc')).toBe(true);
      expect(isEncrypted('encrypted:ABC123+/==.DEF456.GHI789==')).toBe(true);
    });

    it('should return false for invalid base64 characters', () => {
      // Invalid characters in base64 parts
      expect(isEncrypted('encrypted:aaa!.bbb.ccc')).toBe(false);
      expect(isEncrypted('encrypted:aaa.bbb@.ccc')).toBe(false);
      expect(isEncrypted('encrypted:aaa.bbb.ccc#')).toBe(false);
      expect(isEncrypted('encrypted:あああ.bbb.ccc')).toBe(false);
      expect(isEncrypted('encrypted:aaa.bbb.ccc=====')).toBe(false); // Too many '='
    });
  });
});
