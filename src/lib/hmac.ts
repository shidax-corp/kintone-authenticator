import type { HashAlgorithm } from './otpauth-uri';

export const hmac = async (key: Uint8Array, data: Uint8Array, algorithm: HashAlgorithm) => {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key.buffer as ArrayBuffer,
    { name: 'HMAC', hash: { name: algorithm } },
    false,
    ['sign']
  );

  const digest = await crypto.subtle.sign('HMAC', cryptoKey, data.buffer as ArrayBuffer);
  return new Uint8Array(digest);
}
