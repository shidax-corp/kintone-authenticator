const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export const b32encode = (data: ArrayLike<number>): string => {
  let output = '';
  let buffer = 0;
  let offset = 0;

  for (let i = 0; i < data.length; i++) {
    buffer = (buffer << 8) | data[i];
    offset += 8;

    while (offset >= 5) {
      offset -= 5;
      output += BASE32_ALPHABET[(buffer >> offset) & 0b00011111];
    }
  }

  if (offset > 0) {
    output += BASE32_ALPHABET[(buffer << (5 - offset)) & 0b00011111];
  }

  return output.padEnd(Math.ceil(output.length / 8) * 8, '=');
};

export const b32decode = (str: string): Uint8Array => {
  const output = [];
  let buffer = 0;
  let offset = 0;

  str = str.replace(/=/g, ''); // Remove padding characters

  for (let i = 0; i < str.length; i++) {
    const char = str[i].toUpperCase();
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid Base32 character: ${char}`);
    }
    buffer = (buffer << 5) | index;
    offset += 5;

    while (offset >= 8) {
      offset -= 8;
      output.push((buffer >> offset) & 0xff);
    }
  }

  if (offset > 0) {
    output.push((buffer << (8 - offset)) & 0xff);
  }

  return new Uint8Array(output);
};
