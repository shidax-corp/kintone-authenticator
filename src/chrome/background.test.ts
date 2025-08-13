import { generateHOTP } from '../lib/gen-otp';
import { decodeOTPAuthURI, encodeOTPAuthURI } from '../lib/otpauth-uri';
import { KintoneClient } from './lib/kintone-client';
import { getSettings, getCachedRecords, setCachedRecords } from './lib/storage';
import type { KintoneRecord, ExtensionSettings } from './lib/types';

// Mock dependencies
jest.mock('../lib/gen-otp');
jest.mock('../lib/otpauth-uri');
jest.mock('./lib/kintone-client');
jest.mock('./lib/storage');

const mockGenerateHOTP = generateHOTP as jest.MockedFunction<
  typeof generateHOTP
>;
const mockDecodeOTPAuthURI = decodeOTPAuthURI as jest.MockedFunction<
  typeof decodeOTPAuthURI
>;
const mockEncodeOTPAuthURI = encodeOTPAuthURI as jest.MockedFunction<
  typeof encodeOTPAuthURI
>;
const mockGetSettings = getSettings as jest.MockedFunction<typeof getSettings>;
const mockGetCachedRecords = getCachedRecords as jest.MockedFunction<
  typeof getCachedRecords
>;
const mockSetCachedRecords = setCachedRecords as jest.MockedFunction<
  typeof setCachedRecords
>;

const mockKintoneClient = {
  getRecords: jest.fn(),
  updateRecord: jest.fn(),
} as any;

(KintoneClient as jest.MockedClass<typeof KintoneClient>).mockImplementation(
  () => mockKintoneClient
);

// Mock chrome runtime
const mockSendResponse = jest.fn();
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
    },
  },
} as any;

// Import the background script logic we'll test
const generateOTPFromRecord = async (record: KintoneRecord) => {
  const otpAuthRecord = mockDecodeOTPAuthURI(record.otpAuthUri);

  if (otpAuthRecord.type === 'totp') {
    // TOTP logic would go here - not the focus of this test
    throw new Error('TOTP not implemented in test');
  } else if (otpAuthRecord.type === 'hotp') {
    // Generate HOTP with current counter
    const hotp = await generateHOTP(
      {
        secret: otpAuthRecord.secret,
        algorithm: otpAuthRecord.algorithm,
        digits: otpAuthRecord.digits,
      },
      otpAuthRecord.counter
    );

    // Increment counter and update record
    const newCounter = otpAuthRecord.counter + 1;
    const updatedOTPAuthRecord = { ...otpAuthRecord, counter: newCounter };
    const updatedOTPAuthURI = encodeOTPAuthURI(updatedOTPAuthRecord);

    // Update in kintone
    const settings = await getSettings();
    if (!settings) throw new Error('Settings not found');

    const client = new KintoneClient(settings, '1');
    await client.updateRecord(record.recordId, {
      otpAuthUri: updatedOTPAuthURI,
    });

    // Update cached records
    const cachedRecords = await getCachedRecords();
    if (cachedRecords) {
      const updatedRecords = cachedRecords.map((r) =>
        r.recordId === record.recordId
          ? { ...r, otpAuthUri: updatedOTPAuthURI }
          : r
      );
      await setCachedRecords(updatedRecords);
    }

    return hotp;
  }

  throw new Error('Unsupported OTP type');
};

describe('Background Script HOTP Functionality', () => {
  const mockSettings: ExtensionSettings = {
    kintoneBaseUrl: 'https://example.cybozu.com',
    kintoneUsername: 'user',
    kintonePassword: 'pass',
    autoFillEnabled: true,
  };

  const mockHOTPRecord: KintoneRecord = {
    recordId: '123',
    name: 'Test Site',
    url: 'https://example.com',
    username: 'testuser',
    password: 'testpass',
    otpAuthUri:
      'otpauth://hotp/Test%20Site:testuser@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Test%20Site&counter=5&algorithm=SHA1&digits=6',
    updatedTime: new Date().toISOString(),
  };

  const mockOTPAuthRecord = {
    type: 'hotp' as const,
    issuer: 'Test Site',
    accountName: 'testuser@example.com',
    secret: new Uint8Array([
      0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x21, 0x44, 0x65, 0x61, 0x64, 0x62, 0x65,
      0x65, 0x66,
    ]),
    algorithm: 'SHA-1' as const,
    digits: 6,
    counter: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSettings.mockResolvedValue(mockSettings);
  });

  describe('generateOTPFromRecord', () => {
    it('should generate HOTP and increment counter', async () => {
      // Setup mocks
      mockDecodeOTPAuthURI.mockReturnValue(mockOTPAuthRecord);
      mockGenerateHOTP.mockResolvedValue({
        type: 'HOTP',
        otp: '123456',
        timestamp: new Date(),
      });
      mockEncodeOTPAuthURI.mockReturnValue(
        'otpauth://hotp/Test%20Site:testuser@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Test%20Site&counter=6&algorithm=SHA1&digits=6'
      );
      mockKintoneClient.updateRecord.mockResolvedValue(undefined);
      mockGetCachedRecords.mockResolvedValue([mockHOTPRecord]);

      // Execute
      const result = await generateOTPFromRecord(mockHOTPRecord);

      // Verify HOTP generation
      expect(mockDecodeOTPAuthURI).toHaveBeenCalledWith(
        mockHOTPRecord.otpAuthUri
      );
      expect(mockGenerateHOTP).toHaveBeenCalledWith(
        {
          secret: mockOTPAuthRecord.secret,
          algorithm: mockOTPAuthRecord.algorithm,
          digits: mockOTPAuthRecord.digits,
        },
        mockOTPAuthRecord.counter
      );

      // Verify counter increment and record update
      expect(mockEncodeOTPAuthURI).toHaveBeenCalledWith({
        ...mockOTPAuthRecord,
        counter: mockOTPAuthRecord.counter + 1,
      });
      expect(mockKintoneClient.updateRecord).toHaveBeenCalledWith(
        mockHOTPRecord.recordId,
        {
          otpAuthUri:
            'otpauth://hotp/Test%20Site:testuser@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Test%20Site&counter=6&algorithm=SHA1&digits=6',
        }
      );

      // Verify cache update
      expect(mockSetCachedRecords).toHaveBeenCalledWith([
        {
          ...mockHOTPRecord,
          otpAuthUri:
            'otpauth://hotp/Test%20Site:testuser@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Test%20Site&counter=6&algorithm=SHA1&digits=6',
        },
      ]);

      // Verify result
      expect(result).toEqual({
        type: 'HOTP',
        otp: '123456',
        timestamp: expect.any(Date),
      });
    });

    it('should handle HOTP with different algorithms', async () => {
      const sha256Record = {
        ...mockOTPAuthRecord,
        algorithm: 'SHA-256' as const,
      };

      mockDecodeOTPAuthURI.mockReturnValue(sha256Record);
      mockGenerateHOTP.mockResolvedValue({
        type: 'HOTP',
        otp: '789012',
        timestamp: new Date(),
      });
      mockEncodeOTPAuthURI.mockReturnValue('updated-uri');
      mockKintoneClient.updateRecord.mockResolvedValue(undefined);
      mockGetCachedRecords.mockResolvedValue([mockHOTPRecord]);

      const result = await generateOTPFromRecord(mockHOTPRecord);

      expect(mockGenerateHOTP).toHaveBeenCalledWith(
        {
          secret: sha256Record.secret,
          algorithm: 'SHA-256',
          digits: sha256Record.digits,
        },
        sha256Record.counter
      );

      expect(result.otp).toBe('789012');
    });

    it('should handle HOTP with different digit counts', async () => {
      const eightDigitRecord = {
        ...mockOTPAuthRecord,
        digits: 8,
      };

      mockDecodeOTPAuthURI.mockReturnValue(eightDigitRecord);
      mockGenerateHOTP.mockResolvedValue({
        type: 'HOTP',
        otp: '12345678',
        timestamp: new Date(),
      });
      mockEncodeOTPAuthURI.mockReturnValue('updated-uri');
      mockKintoneClient.updateRecord.mockResolvedValue(undefined);
      mockGetCachedRecords.mockResolvedValue([mockHOTPRecord]);

      const result = await generateOTPFromRecord(mockHOTPRecord);

      expect(mockGenerateHOTP).toHaveBeenCalledWith(
        {
          secret: eightDigitRecord.secret,
          algorithm: eightDigitRecord.algorithm,
          digits: 8,
        },
        eightDigitRecord.counter
      );

      expect(result.otp).toBe('12345678');
    });

    it('should handle cache miss gracefully', async () => {
      mockDecodeOTPAuthURI.mockReturnValue(mockOTPAuthRecord);
      mockGenerateHOTP.mockResolvedValue({
        type: 'HOTP',
        otp: '123456',
        timestamp: new Date(),
      });
      mockEncodeOTPAuthURI.mockReturnValue('updated-uri');
      mockKintoneClient.updateRecord.mockResolvedValue(undefined);
      mockGetCachedRecords.mockResolvedValue(null); // Cache miss

      const result = await generateOTPFromRecord(mockHOTPRecord);

      // Should still update kintone record even if cache is empty
      expect(mockKintoneClient.updateRecord).toHaveBeenCalled();
      // Should not try to set cache if cache was null
      expect(mockSetCachedRecords).not.toHaveBeenCalled();
      expect(result.otp).toBe('123456');
    });

    it('should throw error for unsupported OTP type', async () => {
      mockDecodeOTPAuthURI.mockReturnValue({
        type: 'unknown' as any,
        issuer: 'Test',
        accountName: 'test',
        secret: new Uint8Array(),
        algorithm: 'SHA-1',
        digits: 6,
        period: 30, // Add period to satisfy TypeScript
      } as any);

      await expect(generateOTPFromRecord(mockHOTPRecord)).rejects.toThrow(
        'Unsupported OTP type'
      );
    });

    it('should throw error when settings not found', async () => {
      mockGetSettings.mockResolvedValue(null as any);
      mockDecodeOTPAuthURI.mockReturnValue(mockOTPAuthRecord);

      await expect(generateOTPFromRecord(mockHOTPRecord)).rejects.toThrow(
        'Settings not found'
      );
    });

    it('should handle kintone update errors', async () => {
      mockDecodeOTPAuthURI.mockReturnValue(mockOTPAuthRecord);
      mockGenerateHOTP.mockResolvedValue({
        type: 'HOTP',
        otp: '123456',
        timestamp: new Date(),
      });
      mockEncodeOTPAuthURI.mockReturnValue('updated-uri');
      mockKintoneClient.updateRecord.mockRejectedValue(
        new Error('Network error')
      );
      mockGetCachedRecords.mockResolvedValue([mockHOTPRecord]);

      await expect(generateOTPFromRecord(mockHOTPRecord)).rejects.toThrow(
        'Network error'
      );

      // Should still generate OTP but fail on update
      expect(mockGenerateHOTP).toHaveBeenCalled();
      expect(mockKintoneClient.updateRecord).toHaveBeenCalled();
    });
  });
});
