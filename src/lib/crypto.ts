/** Encrypt and decrypt data using Web Crypto API.
 *
 * Uses PBKDF2 with SHA-256 for key derivation and AES-GCM for encryption/decryption.
 * The IV, salt, and ciphertext are encoded in base64 and concatenated with periods: `{iv}.{salt}.{ciphertext}`.
 */

const PREFIX = 'encrypted:';

const generateKey = async (
  pin: string,
  salt: ArrayBuffer
): Promise<CryptoKey> => {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

export const encrypt = async (data: string, pin: string): Promise<string> => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await generateKey(pin, salt.buffer);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    new TextEncoder().encode(data)
  );

  const ivBase64 = btoa(String.fromCharCode(...iv));
  const saltBase64 = btoa(String.fromCharCode(...salt));
  const ciphertextBase64 = btoa(
    String.fromCharCode(...new Uint8Array(ciphertext))
  );

  return `${PREFIX}${ivBase64}.${saltBase64}.${ciphertextBase64}`;
};

export const decrypt = async (data: string, pin: string): Promise<string> => {
  if (!data.startsWith(PREFIX)) {
    throw new Error('Invalid encrypted data format');
  }

  const dataWithoutPrefix = data.substring(PREFIX.length);
  const parts = dataWithoutPrefix.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = Uint8Array.from(atob(parts[0]), (c) => c.charCodeAt(0));
  const salt = Uint8Array.from(atob(parts[1]), (c) => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(parts[2]), (c) => c.charCodeAt(0));

  const key = await generateKey(pin, salt.buffer);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
};

export const isEncrypted = (data: string): boolean => {
  if (!data.startsWith(PREFIX)) {
    return false;
  }
  const dataWithoutPrefix = data.substring(PREFIX.length);
  const parts = dataWithoutPrefix.split('.');
  if (parts.length !== 3) {
    return false;
  }

  // Validate that each part contains only valid base64 characters
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return parts.every((part) => base64Regex.test(part));
};
