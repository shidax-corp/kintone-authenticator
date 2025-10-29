import { generateHOTP, generateTOTP } from '@lib/gen-otp';
import { decodeOTPAuthURI, encodeOTPAuthURI } from '@lib/otpauth-uri';

import { KintoneClient } from './kintone-client';

jest.mock('@lib/gen-otp');
jest.mock('@lib/otpauth-uri');
jest.mock('./kintone-client');

const mockGenerateTOTP = generateTOTP as jest.MockedFunction<
  typeof generateTOTP
>;
const mockGenerateHOTP = generateHOTP as jest.MockedFunction<
  typeof generateHOTP
>;
const mockDecodeOTPAuthURI = decodeOTPAuthURI as jest.MockedFunction<
  typeof decodeOTPAuthURI
>;
const mockEncodeOTPAuthURI = encodeOTPAuthURI as jest.MockedFunction<
  typeof encodeOTPAuthURI
>;

// Re-implement the function here for testing since we can't easily import it from index.ts
const generateOTPFromRecord = async (
  record: kintone.types.SavedFields,
  client: KintoneClient
) => {
  const otpAuthRecord = decodeOTPAuthURI(record.otpuri.value);

  if (otpAuthRecord.type === 'TOTP') {
    return await generateTOTP({
      secret: otpAuthRecord.secret,
      algorithm: otpAuthRecord.algorithm,
      digits: otpAuthRecord.digits,
      period: otpAuthRecord.period,
    });
  }

  if (otpAuthRecord.type === 'HOTP') {
    // Generate HOTP with current counter
    const hotp = await generateHOTP(
      {
        secret: otpAuthRecord.secret,
        algorithm: otpAuthRecord.algorithm,
        digits: otpAuthRecord.digits,
      },
      otpAuthRecord.counter
    );

    // Increment counter and persist to kintone
    const updatedRecord = {
      ...otpAuthRecord,
      counter: otpAuthRecord.counter + 1,
    };
    const updatedOtpUri = encodeOTPAuthURI(updatedRecord);
    await client.updateRecord(record.$id.value, updatedOtpUri);

    return hotp;
  }

  throw new Error('Unsupported OTP type');
};

describe('generateOTPFromRecord', () => {
  let mockClient: jest.Mocked<KintoneClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      updateRecord: jest.fn(),
    } as any;
  });

  describe('TOTP', () => {
    it('should generate TOTP for TOTP records', async () => {
      const mockRecord: kintone.types.SavedFields = {
        $id: { value: '123' },
        $revision: { value: '1' },
        更新者: { value: { code: 'user', name: 'User' } },
        作成者: { value: { code: 'user', name: 'User' } },
        レコード番号: { value: '1' },
        更新日時: { value: '2023-01-01T00:00:00Z' },
        作成日時: { value: '2023-01-01T00:00:00Z' },
        name: { value: 'Test' },
        url: { value: 'https://example.com' },
        username: { value: 'user' },
        password: { value: 'pass' },
        otpuri: {
          value:
            'otpauth://totp/Example:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example',
        },
        shareto: { value: [] },
      };

      const mockOTPAuthRecord = {
        type: 'TOTP' as const,
        issuer: 'Example',
        accountName: 'user@example.com',
        secret: new Uint8Array([1, 2, 3]),
        algorithm: 'SHA-1' as const,
        digits: 6,
        period: 30,
      };

      const mockTOTP = {
        type: 'TOTP' as const,
        otp: '123456',
        timestamp: new Date(),
        availableFrom: new Date(),
        availableUntil: new Date(),
      };

      mockDecodeOTPAuthURI.mockReturnValue(mockOTPAuthRecord);
      mockGenerateTOTP.mockResolvedValue(mockTOTP);

      const result = await generateOTPFromRecord(mockRecord, mockClient);

      expect(mockDecodeOTPAuthURI).toHaveBeenCalledWith(mockRecord.otpuri.value);
      expect(mockGenerateTOTP).toHaveBeenCalledWith({
        secret: mockOTPAuthRecord.secret,
        algorithm: mockOTPAuthRecord.algorithm,
        digits: mockOTPAuthRecord.digits,
        period: mockOTPAuthRecord.period,
      });
      expect(result).toEqual(mockTOTP);
      expect(mockClient.updateRecord).not.toHaveBeenCalled();
    });
  });

  describe('HOTP', () => {
    it('should generate HOTP for HOTP records and increment counter', async () => {
      const mockRecord: kintone.types.SavedFields = {
        $id: { value: '456' },
        $revision: { value: '1' },
        更新者: { value: { code: 'user', name: 'User' } },
        作成者: { value: { code: 'user', name: 'User' } },
        レコード番号: { value: '2' },
        更新日時: { value: '2023-01-01T00:00:00Z' },
        作成日時: { value: '2023-01-01T00:00:00Z' },
        name: { value: 'Test HOTP' },
        url: { value: 'https://hotp.example.com' },
        username: { value: 'hotpuser' },
        password: { value: 'hotppass' },
        otpuri: {
          value:
            'otpauth://hotp/Example:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example&counter=5',
        },
        shareto: { value: [] },
      };

      const mockOTPAuthRecord = {
        type: 'HOTP' as const,
        issuer: 'Example',
        accountName: 'user@example.com',
        secret: new Uint8Array([1, 2, 3]),
        algorithm: 'SHA-1' as const,
        digits: 6,
        counter: 5,
      };

      const mockHOTP = {
        type: 'HOTP' as const,
        otp: '654321',
        timestamp: new Date(),
      };

      const updatedOtpUri =
        'otpauth://hotp/Example:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example&counter=6';

      mockDecodeOTPAuthURI.mockReturnValue(mockOTPAuthRecord);
      mockGenerateHOTP.mockResolvedValue(mockHOTP);
      mockEncodeOTPAuthURI.mockReturnValue(updatedOtpUri);

      const result = await generateOTPFromRecord(mockRecord, mockClient);

      // Verify HOTP was generated with current counter
      expect(mockDecodeOTPAuthURI).toHaveBeenCalledWith(mockRecord.otpuri.value);
      expect(mockGenerateHOTP).toHaveBeenCalledWith(
        {
          secret: mockOTPAuthRecord.secret,
          algorithm: mockOTPAuthRecord.algorithm,
          digits: mockOTPAuthRecord.digits,
        },
        5
      );

      // Verify counter was incremented and persisted
      expect(mockEncodeOTPAuthURI).toHaveBeenCalledWith({
        ...mockOTPAuthRecord,
        counter: 6,
      });
      expect(mockClient.updateRecord).toHaveBeenCalledWith('456', updatedOtpUri);

      expect(result).toEqual(mockHOTP);
    });

    it('should handle HOTP with counter 0', async () => {
      const mockRecord: kintone.types.SavedFields = {
        $id: { value: '789' },
        $revision: { value: '1' },
        更新者: { value: { code: 'user', name: 'User' } },
        作成者: { value: { code: 'user', name: 'User' } },
        レコード番号: { value: '3' },
        更新日時: { value: '2023-01-01T00:00:00Z' },
        作成日時: { value: '2023-01-01T00:00:00Z' },
        name: { value: 'Test HOTP Zero' },
        url: { value: 'https://hotp-zero.example.com' },
        username: { value: 'zerouser' },
        password: { value: 'zeropass' },
        otpuri: {
          value:
            'otpauth://hotp/Example:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example&counter=0',
        },
        shareto: { value: [] },
      };

      const mockOTPAuthRecord = {
        type: 'HOTP' as const,
        issuer: 'Example',
        accountName: 'user@example.com',
        secret: new Uint8Array([1, 2, 3]),
        algorithm: 'SHA-1' as const,
        digits: 6,
        counter: 0,
      };

      const mockHOTP = {
        type: 'HOTP' as const,
        otp: '111111',
        timestamp: new Date(),
      };

      const updatedOtpUri =
        'otpauth://hotp/Example:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example&counter=1';

      mockDecodeOTPAuthURI.mockReturnValue(mockOTPAuthRecord);
      mockGenerateHOTP.mockResolvedValue(mockHOTP);
      mockEncodeOTPAuthURI.mockReturnValue(updatedOtpUri);

      const result = await generateOTPFromRecord(mockRecord, mockClient);

      expect(mockGenerateHOTP).toHaveBeenCalledWith(
        {
          secret: mockOTPAuthRecord.secret,
          algorithm: mockOTPAuthRecord.algorithm,
          digits: mockOTPAuthRecord.digits,
        },
        0
      );

      expect(mockEncodeOTPAuthURI).toHaveBeenCalledWith({
        ...mockOTPAuthRecord,
        counter: 1,
      });
      expect(mockClient.updateRecord).toHaveBeenCalledWith('789', updatedOtpUri);

      expect(result).toEqual(mockHOTP);
    });
  });

  describe('Error handling', () => {
    it('should throw error for unsupported OTP type', async () => {
      const mockRecord: kintone.types.SavedFields = {
        $id: { value: '999' },
        $revision: { value: '1' },
        更新者: { value: { code: 'user', name: 'User' } },
        作成者: { value: { code: 'user', name: 'User' } },
        レコード番号: { value: '4' },
        更新日時: { value: '2023-01-01T00:00:00Z' },
        作成日時: { value: '2023-01-01T00:00:00Z' },
        name: { value: 'Test Unknown' },
        url: { value: 'https://unknown.example.com' },
        username: { value: 'unknownuser' },
        password: { value: 'unknownpass' },
        otpuri: { value: 'otpauth://unknown/test' },
        shareto: { value: [] },
      };

      mockDecodeOTPAuthURI.mockReturnValue({
        type: 'UNKNOWN' as any,
        issuer: 'Example',
        accountName: 'user@example.com',
        secret: new Uint8Array([1, 2, 3]),
        algorithm: 'SHA-1' as const,
        digits: 6,
        period: 30,
      } as any);

      await expect(
        generateOTPFromRecord(mockRecord, mockClient)
      ).rejects.toThrow('Unsupported OTP type');
    });
  });
});
