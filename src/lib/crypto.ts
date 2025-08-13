export class CryptoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CryptoError';
  }
}

const IV_LENGTH = 12;

export const generateKey = async (passphrase: string): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const passphraseBytes = encoder.encode(passphrase);
  
  // SHA-256でパスフレーズをハッシュ化
  const hashBuffer = await crypto.subtle.digest('SHA-256', passphraseBytes);
  
  // ハッシュをAES-GCM用のキーとしてインポート
  return crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

export const encrypt = async (plaintext: string, passphrase: string): Promise<string> => {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const key = await generateKey(passphrase);
    
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    const encryptedArray = new Uint8Array(encryptedData);
    
    // 暗号化データとIVをそれぞれBase64でエンコードして、`.`で連結
    const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray));
    const ivBase64 = btoa(String.fromCharCode(...iv));
    
    return `${encryptedBase64}.${ivBase64}`;
  } catch (error) {
    throw new CryptoError(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const decrypt = async (encryptedText: string, passphrase: string): Promise<string> => {
  try {
    // 暗号化データとIVを`.`で分割
    const parts = encryptedText.split('.');
    if (parts.length !== 2) {
      throw new CryptoError('Invalid encrypted data format');
    }
    
    const [encryptedBase64, ivBase64] = parts;
    
    const encryptedData = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    
    if (iv.length !== IV_LENGTH) {
      throw new CryptoError('Invalid IV length');
    }
    
    const key = await generateKey(passphrase);
    
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    if (error instanceof CryptoError) {
      throw error;
    }
    throw new CryptoError(`Decryption failed: ${error instanceof Error ? error.message : 'Invalid passphrase or corrupted data'}`);
  }
};

export const isEncrypted = (text: string): boolean => {
  try {
    // 新しいフォーマット: {暗号化データ}.{IV}
    const parts = text.split('.');
    if (parts.length !== 2) {
      return false;
    }
    
    const [encryptedBase64, ivBase64] = parts;
    
    // Base64として有効かチェック
    atob(encryptedBase64);
    const iv = atob(ivBase64);
    
    // IVの長さが正しいかチェック
    return iv.length === IV_LENGTH;
  } catch {
    return false;
  }
};