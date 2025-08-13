import { encrypt, decrypt, isEncrypted, CryptoError, generateKey } from './crypto';

const mockCrypto = {
  subtle: {
    importKey: jest.fn(),
    digest: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  },
  getRandomValues: jest.fn((array: Uint8Array) => {
    // 固定値で初期化してテストを安定させる
    for (let i = 0; i < array.length; i++) {
      array[i] = i % 256;
    }
    return array;
  }),
};

global.crypto = mockCrypto as any;

describe('crypto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateKey', () => {
    it('should generate key from passphrase using SHA-256', async () => {
      const passphrase = 'secret123';
      const mockHashBuffer = new ArrayBuffer(32);
      const mockKey = {};
      
      mockCrypto.subtle.digest.mockResolvedValue(mockHashBuffer);
      mockCrypto.subtle.importKey.mockResolvedValue(mockKey);
      
      const result = await generateKey(passphrase);
      
      expect(result).toBe(mockKey);
      expect(mockCrypto.subtle.digest).toHaveBeenCalledWith(
        'SHA-256',
        expect.any(Uint8Array)
      );
      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
        'raw',
        mockHashBuffer,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    });
  });

  describe('encrypt', () => {
    it('should encrypt plaintext successfully', async () => {
      const plaintext = 'Hello, World!';
      const passphrase = 'secret123';
      
      const mockHashBuffer = new ArrayBuffer(32);
      const mockKey = {};
      const encryptedArrayBuffer = new ArrayBuffer(32);
      
      mockCrypto.subtle.digest.mockResolvedValue(mockHashBuffer);
      mockCrypto.subtle.importKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.encrypt.mockResolvedValue(encryptedArrayBuffer);
      
      const result = await encrypt(plaintext, passphrase);
      
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^[A-Za-z0-9+/]+=*\.[A-Za-z0-9+/]+=*$/); // Base64.Base64 format
      expect(mockCrypto.subtle.digest).toHaveBeenCalled();
      expect(mockCrypto.subtle.importKey).toHaveBeenCalled();
      expect(mockCrypto.subtle.encrypt).toHaveBeenCalled();
    });

    it('should throw CryptoError on encryption failure', async () => {
      const plaintext = 'Hello, World!';
      const passphrase = 'secret123';
      
      mockCrypto.subtle.digest.mockRejectedValue(new Error('Digest failed'));
      
      await expect(encrypt(plaintext, passphrase)).rejects.toThrow(CryptoError);
      await expect(encrypt(plaintext, passphrase)).rejects.toThrow('Encryption failed');
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted text successfully', async () => {
      const plaintext = 'Hello, World!';
      const passphrase = 'secret123';
      
      // 新しいフォーマット: encrypted.iv
      const encryptedData = new Uint8Array(32);
      const iv = new Uint8Array(12);
      
      const encryptedBase64 = btoa(String.fromCharCode(...encryptedData));
      const ivBase64 = btoa(String.fromCharCode(...iv));
      const encryptedText = `${encryptedBase64}.${ivBase64}`;
      
      const mockHashBuffer = new ArrayBuffer(32);
      const mockKey = {};
      const decryptedBuffer = new TextEncoder().encode(plaintext).buffer;
      
      mockCrypto.subtle.digest.mockResolvedValue(mockHashBuffer);
      mockCrypto.subtle.importKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.decrypt.mockResolvedValue(decryptedBuffer);
      
      const result = await decrypt(encryptedText, passphrase);
      
      expect(result).toBe(plaintext);
      expect(mockCrypto.subtle.decrypt).toHaveBeenCalled();
    });

    it('should throw CryptoError for invalid encrypted data format', async () => {
      const invalidData = 'no-dot-separator';
      const passphrase = 'secret123';
      
      await expect(decrypt(invalidData, passphrase)).rejects.toThrow(CryptoError);
      await expect(decrypt(invalidData, passphrase)).rejects.toThrow('Invalid encrypted data format');
    });

    it('should throw CryptoError for invalid IV length', async () => {
      const encryptedBase64 = btoa('encrypted');
      const shortIvBase64 = btoa('short'); // Too short for 12 bytes
      const encryptedText = `${encryptedBase64}.${shortIvBase64}`;
      const passphrase = 'secret123';
      
      await expect(decrypt(encryptedText, passphrase)).rejects.toThrow(CryptoError);
      await expect(decrypt(encryptedText, passphrase)).rejects.toThrow('Invalid IV length');
    });

    it('should throw CryptoError on decryption failure', async () => {
      const encryptedData = new Uint8Array(32);
      const iv = new Uint8Array(12);
      
      const encryptedBase64 = btoa(String.fromCharCode(...encryptedData));
      const ivBase64 = btoa(String.fromCharCode(...iv));
      const encryptedText = `${encryptedBase64}.${ivBase64}`;
      const passphrase = 'wrong-passphrase';
      
      const mockHashBuffer = new ArrayBuffer(32);
      const mockKey = {};
      
      mockCrypto.subtle.digest.mockResolvedValue(mockHashBuffer);
      mockCrypto.subtle.importKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.decrypt.mockRejectedValue(new Error('Decryption failed'));
      
      await expect(decrypt(encryptedText, passphrase)).rejects.toThrow(CryptoError);
      await expect(decrypt(encryptedText, passphrase)).rejects.toThrow('Decryption failed');
    });
  });

  describe('isEncrypted', () => {
    it('should return true for valid encrypted format', () => {
      const encryptedData = new Uint8Array(32);
      const iv = new Uint8Array(12);
      
      const encryptedBase64 = btoa(String.fromCharCode(...encryptedData));
      const ivBase64 = btoa(String.fromCharCode(...iv));
      const encryptedText = `${encryptedBase64}.${ivBase64}`;
      
      expect(isEncrypted(encryptedText)).toBe(true);
    });

    it('should return false for data without dot separator', () => {
      const data = btoa('no-dot-separator');
      expect(isEncrypted(data)).toBe(false);
    });

    it('should return false for invalid base64', () => {
      expect(isEncrypted('invalid.base64!')).toBe(false);
    });

    it('should return false for plain text', () => {
      expect(isEncrypted('Hello, World!')).toBe(false);
    });

    it('should return false for wrong IV length', () => {
      const encryptedBase64 = btoa('encrypted');
      const shortIvBase64 = btoa('short'); // Too short for 12 bytes
      const encryptedText = `${encryptedBase64}.${shortIvBase64}`;
      
      expect(isEncrypted(encryptedText)).toBe(false);
    });

    it('should return false for too many parts', () => {
      expect(isEncrypted('part1.part2.part3')).toBe(false);
    });
  });
});