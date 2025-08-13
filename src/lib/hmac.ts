export type HashAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-512';

const hashWidths: { [key in HashAlgorithm]: number } = {
  'SHA-1': 8,
  'SHA-256': 32,
  'SHA-512': 64,
};

/** Converts a number to a byte array in big-endian format.
 */
const int2bytes = (num: number, width: number = 8) => {
  const output = new Uint8Array(width);

  for (let i = width - 1; i >= 0; i--) {
    output[i] = num & 0xff;
    num >>= 8;
  }

  return output;
};

export const hmac = async (
  key: Uint8Array,
  data: Uint8Array | number,
  algorithm: HashAlgorithm
): Promise<Uint8Array> => {
  if (typeof data === 'number') {
    data = int2bytes(data, 8);
  }

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key.buffer as ArrayBuffer,
    { name: 'HMAC', hash: { name: algorithm } },
    false,
    ['sign']
  );

  const digest = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    data.buffer as ArrayBuffer
  );
  return new Uint8Array(digest);
};
