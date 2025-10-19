import type {
  ExtensionSettings,
  FillOTPMessage,
  GetOTPMessage,
  GetRecordsMessage,
  Message,
  MessageType,
  OpenRegisterFormMessage,
  ReadQRFromImageMessage,
  RegisterOTPMessage,
  ShowErrorMessage,
  ShowFillOptionsMessage,
  TestConnectionMessage,
} from './types';

describe('types', () => {
  describe('MessageType', () => {
    it('should include all defined message types', () => {
      const messageTypes: MessageType[] = [
        'REGISTER_OTP',
        'GET_RECORDS',
        'GET_OTP',
        'GET_SETTINGS',
        'TEST_CONNECTION',
        'SHOW_ERROR',
        'SHOW_FILL_OPTIONS',
        'OPEN_REGISTER_FORM',
        'FILL_OTP',
        'READ_QR_FROM_IMAGE',
      ];

      // 型チェックのためのコンパイル時検証
      const allTypesAreStrings = messageTypes.every(
        (type) => typeof type === 'string'
      );
      expect(allTypesAreStrings).toBe(true);
    });
  });

  describe('Message interfaces', () => {
    it('should validate RegisterOTPMessage structure', () => {
      const message: RegisterOTPMessage = {
        type: 'REGISTER_OTP',
        data: {
          name: 'Test Site',
          url: 'https://example.com',
          username: 'user',
          password: 'pass',
          otpAuthUri: 'otpauth://totp/test',
        },
      };

      expect(message.type).toBe('REGISTER_OTP');
      expect(message.data.name).toBe('Test Site');
    });

    it('should validate GetRecordsMessage structure', () => {
      const message: GetRecordsMessage = {
        type: 'GET_RECORDS',
        data: {
          forceRefresh: true,
        },
      };

      expect(message.type).toBe('GET_RECORDS');
      expect(message.data?.forceRefresh).toBe(true);
    });

    it('should validate GetOTPMessage structure', () => {
      const message: GetOTPMessage = {
        type: 'GET_OTP',
        data: {
          recordId: '123',
        },
      };

      expect(message.type).toBe('GET_OTP');
      expect(message.data.recordId).toBe('123');
    });

    it('should validate TestConnectionMessage structure', () => {
      const settings: ExtensionSettings = {
        kintoneBaseUrl: 'https://example.cybozu.com',
        kintoneAppId: '123',
        kintoneUsername: 'user',
        kintonePassword: 'pass',
        autoFillEnabled: true,
      };

      const message: TestConnectionMessage = {
        type: 'TEST_CONNECTION',
        data: settings,
      };

      expect(message.type).toBe('TEST_CONNECTION');
      expect(message.data.kintoneBaseUrl).toBe('https://example.cybozu.com');
    });

    it('should validate ShowErrorMessage structure', () => {
      const message: ShowErrorMessage = {
        type: 'SHOW_ERROR',
        data: {
          message: 'エラーが発生しました',
        },
      };

      expect(message.type).toBe('SHOW_ERROR');
      expect(message.data.message).toBe('エラーが発生しました');
    });

    it('should validate ShowFillOptionsMessage structure', () => {
      const records: kintone.types.SavedFields[] = [
        {
          $id: { value: '1' },
          $revision: { value: '1' },
          更新者: { value: { code: 'user', name: 'User' } },
          作成者: { value: { code: 'user', name: 'User' } },
          レコード番号: { value: '1' },
          更新日時: { value: '2025-01-01T00:00:00Z' },
          作成日時: { value: '2025-01-01T00:00:00Z' },
          name: { value: 'Test Site' },
          url: { value: 'https://example.com' },
          username: { value: 'user' },
          password: { value: 'pass' },
          otpuri: { value: 'encrypted' },
          shareto: { value: [] },
        },
      ];

      const message: ShowFillOptionsMessage = {
        type: 'SHOW_FILL_OPTIONS',
        data: {
          records: records,
          currentUrl: 'https://example.com',
        },
      };

      expect(message.type).toBe('SHOW_FILL_OPTIONS');
      expect(message.data.records).toHaveLength(1);
      expect(message.data.currentUrl).toBe('https://example.com');
    });

    it('should validate OpenRegisterFormMessage structure', () => {
      const message: OpenRegisterFormMessage = {
        type: 'OPEN_REGISTER_FORM',
        data: {
          otpAuthUri: 'otpauth://totp/test',
        },
      };

      expect(message.type).toBe('OPEN_REGISTER_FORM');
      expect(message.data.otpAuthUri).toBe('otpauth://totp/test');
    });

    it('should validate FillOTPMessage structure', () => {
      const message: FillOTPMessage = {
        type: 'FILL_OTP',
        data: {
          otp: '123456',
        },
      };

      expect(message.type).toBe('FILL_OTP');
      expect(message.data.otp).toBe('123456');
    });

    it('should validate ReadQRFromImageMessage structure', () => {
      const message: ReadQRFromImageMessage = {
        type: 'READ_QR_FROM_IMAGE',
        data: {
          imageUrl: 'https://example.com/qr.png',
        },
      };

      expect(message.type).toBe('READ_QR_FROM_IMAGE');
      expect(message.data.imageUrl).toBe('https://example.com/qr.png');
    });

    it('should allow Message type for generic messages', () => {
      const message: Message = {
        type: 'GET_SETTINGS',
      };

      expect(message.type).toBe('GET_SETTINGS');
    });
  });

  describe('Type safety', () => {
    it('should enforce type checking for message types', () => {
      // これらはコンパイル時に型チェックされる
      const validMessage: Message = {
        type: 'REGISTER_OTP',
        data: {},
      };

      expect(validMessage.type).toBe('REGISTER_OTP');
    });

    it('should enforce data structure for specific message types', () => {
      const errorMessage: ShowErrorMessage = {
        type: 'SHOW_ERROR',
        data: {
          message: 'test error',
        },
      };

      expect(errorMessage.data.message).toBe('test error');
    });
  });
});
