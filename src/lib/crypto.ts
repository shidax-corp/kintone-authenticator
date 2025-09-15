/** Encrypt and decrypt data using Web Crypto API.
 *
 * Uses PBKDF2 with SHA-256 for key derivation and AES-GCM for encryption/decryption.
 * The IV, salt, and ciphertext are encoded in base64 and concatenated with periods: `{iv}.{salt}.{ciphertext}`.
 */

export const encrypt = async (data: string, pin: string): Promise<string> => {
  // TODO: implement
}

export const decrypt = async (data: string, pin: string): Promise<string> => {
  // TODO: implement
}
