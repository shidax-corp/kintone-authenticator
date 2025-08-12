import { b32encode, b32decode } from './base32';

describe('base32', () => {
  describe('b32encode', () => {
    it('empty input', () => {
      expect(b32encode(new Uint8Array([]))).toBe('');
    });

    it('short input', () => {
      const data = new TextEncoder().encode('hey');
      expect(b32encode(data)).toBe('NBSXS===');
    });

    it('long input', () => {
      const data = new TextEncoder().encode('The quick brown fox jumps over the lazy dog');
      expect(b32encode(data)).toBe('KRUGKIDROVUWG2ZAMJZG653OEBTG66BANJ2W24DTEBXXMZLSEB2GQZJANRQXU6JAMRXWO===');
    });
  });

  describe('b32decode', () => {
    it('empty input', () => {
      expect(b32decode('')).toEqual(new Uint8Array([]));
    });

    it('short input', () => {
      const expected = new TextEncoder().encode('hey\0');
      expect(b32decode('NBSXS===')).toEqual(expected);
    });

    it('long input', () => {
      const expected = new TextEncoder().encode('The quick brown fox jumps over the lazy dog\0');
      expect(b32decode('KRUGKIDROVUWG2ZAMJZG653OEBTG66BANJ2W24DTEBXXMZLSEB2GQZJANRQXU6JAMRXWO===')).toEqual(expected);
    });

    it('invalid characters', () => {
      expect(() => b32decode('invalid!')).toThrow(/Invalid Base32 character/);
    });
  });

  it('b32encode and b32decode', () => {
    const originalData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const encoded = b32encode(originalData);
    const decoded = b32decode(encoded);
    expect(decoded).toEqual(originalData);
  });
});
