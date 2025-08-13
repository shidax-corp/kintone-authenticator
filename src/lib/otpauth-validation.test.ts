import {
  validateOTPAuthURI,
  getValidationErrorMessage,
  formatOTPAuthParameters,
} from './otpauth-validation';

describe('otpauth-validation', () => {
  describe('validateOTPAuthURI', () => {
    describe('valid URIs', () => {
      const validURIs = [
        {
          name: 'basic TOTP URI',
          uri: 'otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example',
          expectedType: 'totp',
          expectedIssuer: 'Example',
          expectedAccount: 'alice@google.com',
        },
        {
          name: 'basic HOTP URI',
          uri: 'otpauth://hotp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example&counter=1',
          expectedType: 'hotp',
          expectedIssuer: 'Example',
          expectedAccount: 'alice@google.com',
        },
        {
          name: 'TOTP with all parameters',
          uri: 'otpauth://totp/ACME%20Co:john.doe@example.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=ACME%20Co&algorithm=SHA1&digits=6&period=30',
          expectedType: 'totp',
          expectedIssuer: 'ACME Co',
          expectedAccount: 'john.doe@example.com',
        },
        {
          name: 'HOTP with all parameters',
          uri: 'otpauth://hotp/ACME%20Co:john.doe@example.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=ACME%20Co&algorithm=SHA256&digits=8&counter=0',
          expectedType: 'hotp',
          expectedIssuer: 'ACME Co',
          expectedAccount: 'john.doe@example.com',
        },
        {
          name: 'TOTP with SHA512',
          uri: 'otpauth://totp/Test:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Test&algorithm=SHA512&digits=8&period=60',
          expectedType: 'totp',
          expectedIssuer: 'Test',
          expectedAccount: 'test@example.com',
        },
      ];

      it.each(validURIs)(
        'should validate $name successfully',
        ({ uri, expectedType, expectedIssuer, expectedAccount }) => {
          const result = validateOTPAuthURI(uri);

          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
          expect(result.parsedData).toBeDefined();
          expect(result.parsedData?.type).toBe(expectedType);
          expect(result.parsedData?.issuer).toBe(expectedIssuer);
          expect(result.parsedData?.accountName).toBe(expectedAccount);
        }
      );
    });

    describe('invalid URIs', () => {
      const invalidURIs = [
        {
          name: 'empty URI',
          uri: '',
          expectedErrorField: 'uri',
          expectedErrorMessage: 'URIが空です',
        },
        {
          name: 'whitespace only',
          uri: '   ',
          expectedErrorField: 'uri',
          expectedErrorMessage: 'URIが空です',
        },
        {
          name: 'wrong protocol',
          uri: 'https://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example',
          expectedErrorField: 'format',
        },
        {
          name: 'invalid type',
          uri: 'otpauth://invalid/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example',
          expectedErrorField: 'type',
          expectedErrorMessage:
            'タイプは "totp" または "hotp" である必要があります',
        },
        {
          name: 'missing secret',
          uri: 'otpauth://totp/Example:alice@google.com?issuer=Example',
          expectedErrorField: 'secret',
          expectedErrorMessage: 'secret パラメータは必須です',
        },
        {
          name: 'invalid Base32 secret',
          uri: 'otpauth://totp/Example:alice@google.com?secret=INVALID!@#&issuer=Example',
          expectedErrorField: 'secret',
          expectedErrorMessage:
            'secretは有効なBase32文字列である必要があります (A-Z, 2-7, =)',
        },
        {
          name: 'missing label',
          uri: 'otpauth://totp/?secret=JBSWY3DPEHPK3PXP&issuer=Example',
          expectedErrorField: 'label',
          expectedErrorMessage: 'ラベル (発行者:アカウント名) は必須です',
        },
        {
          name: 'invalid label format (no colon)',
          uri: 'otpauth://totp/Example-alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example',
          expectedErrorField: 'label',
          expectedErrorMessage:
            'ラベルは "発行者:アカウント名" の形式である必要があります',
        },
        {
          name: 'invalid algorithm',
          uri: 'otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example&algorithm=MD5',
          expectedErrorField: 'algorithm',
          expectedErrorMessage:
            'algorithmは SHA1, SHA256, SHA512 のいずれかである必要があります',
        },
        {
          name: 'invalid digits (too small)',
          uri: 'otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example&digits=0',
          expectedErrorField: 'digits',
          expectedErrorMessage: 'digitsは1から10の間の数値である必要があります',
        },
        {
          name: 'invalid digits (too large)',
          uri: 'otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example&digits=15',
          expectedErrorField: 'digits',
          expectedErrorMessage: 'digitsは1から10の間の数値である必要があります',
        },
        {
          name: 'invalid digits (not a number)',
          uri: 'otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example&digits=abc',
          expectedErrorField: 'digits',
          expectedErrorMessage: 'digitsは1から10の間の数値である必要があります',
        },
        {
          name: 'invalid period (negative)',
          uri: 'otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example&period=-1',
          expectedErrorField: 'period',
          expectedErrorMessage: 'periodは正の整数である必要があります',
        },
        {
          name: 'invalid period (zero)',
          uri: 'otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example&period=0',
          expectedErrorField: 'period',
          expectedErrorMessage: 'periodは正の整数である必要があります',
        },
        {
          name: 'invalid counter (negative)',
          uri: 'otpauth://hotp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example&counter=-1',
          expectedErrorField: 'counter',
          expectedErrorMessage: 'counterは0以上の整数である必要があります',
        },
      ];

      it.each(invalidURIs)(
        'should reject $name',
        ({ uri, expectedErrorField, expectedErrorMessage }) => {
          const result = validateOTPAuthURI(uri);

          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.parsedData).toBeUndefined();

          const fieldError = result.errors.find(
            (error) => error.field === expectedErrorField
          );
          expect(fieldError).toBeDefined();

          if (expectedErrorMessage) {
            expect(fieldError?.message).toBe(expectedErrorMessage);
          }
        }
      );
    });

    describe('edge cases', () => {
      it('should handle URI with extra whitespace', () => {
        const uri =
          '  otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example  ';
        const result = validateOTPAuthURI(uri);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should handle URI with encoded special characters', () => {
        const uri =
          'otpauth://totp/Test%20Service:user%2Btest@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Test%20Service';
        const result = validateOTPAuthURI(uri);

        expect(result.isValid).toBe(true);
        expect(result.parsedData?.issuer).toBe('Test Service');
        expect(result.parsedData?.accountName).toBe('user+test@example.com');
      });

      it('should handle case insensitive Base32 secret', () => {
        const uri =
          'otpauth://totp/Example:alice@google.com?secret=jbswy3dpehpk3pxp&issuer=Example';
        const result = validateOTPAuthURI(uri);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should handle case insensitive algorithm', () => {
        const uri =
          'otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example&algorithm=sha256';
        const result = validateOTPAuthURI(uri);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe('getValidationErrorMessage', () => {
    it('should return empty string for no errors', () => {
      const message = getValidationErrorMessage([]);
      expect(message).toBe('');
    });

    it('should return first error message', () => {
      const errors = [
        { field: 'secret', message: 'Secret is missing' },
        { field: 'issuer', message: 'Issuer is missing' },
      ];
      const message = getValidationErrorMessage(errors);
      expect(message).toBe('Secret is missing');
    });
  });

  describe('formatOTPAuthParameters', () => {
    it('should format TOTP parameters', () => {
      const mockTotpData = {
        type: 'totp' as const,
        issuer: 'Example',
        accountName: 'alice@google.com',
        secret: new Uint8Array([1, 2, 3]),
        algorithm: 'SHA-1' as const,
        digits: 6,
        period: 30,
      };

      const formatted = formatOTPAuthParameters(mockTotpData);

      expect(formatted).toEqual({
        type: 'TOTP',
        issuer: 'Example',
        accountName: 'alice@google.com',
        algorithm: 'SHA-1',
        digits: '6',
        period: '30',
      });
    });

    it('should format HOTP parameters', () => {
      const mockHotpData = {
        type: 'hotp' as const,
        issuer: 'Example',
        accountName: 'alice@google.com',
        secret: new Uint8Array([1, 2, 3]),
        algorithm: 'SHA-256' as const,
        digits: 8,
        counter: 5,
      };

      const formatted = formatOTPAuthParameters(mockHotpData);

      expect(formatted).toEqual({
        type: 'HOTP',
        issuer: 'Example',
        accountName: 'alice@google.com',
        algorithm: 'SHA-256',
        digits: '8',
        counter: '5',
      });
    });
  });
});
