/** Encrypt and decrypt data using Web Crypto API.
 *
 * Uses PBKDF2 with SHA-256 for key derivation and AES-GCM for encryption/decryption.
 * The IV, salt, and ciphertext are encoded in base64 and concatenated with periods: `{iv}.{salt}.{ciphertext}`.
 */

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
      iterations: 10000,
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

  const ivBase64 = Buffer.from(iv).toString('base64');
  const saltBase64 = Buffer.from(salt).toString('base64');
  const ciphertextBase64 = Buffer.from(ciphertext).toString('base64');

  return `${ivBase64}.${saltBase64}.${ciphertextBase64}`;
};

export const decrypt = async (data: string, pin: string): Promise<string> => {
  const parts = data.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = new Uint8Array(Buffer.from(parts[0], 'base64'));
  const salt = new Uint8Array(Buffer.from(parts[1], 'base64'));
  const ciphertext = new Uint8Array(Buffer.from(parts[2], 'base64'));

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
