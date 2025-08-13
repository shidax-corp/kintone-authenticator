import { isOTPAuthURI } from './qr-reader';
import { decodeOTPAuthURI } from './otpauth-uri';
import { b32decode } from './base32';

export interface OTPAuthValidationError {
  field: string;
  message: string;
}

export interface OTPAuthValidationResult {
  isValid: boolean;
  errors: OTPAuthValidationError[];
  parsedData?: ReturnType<typeof decodeOTPAuthURI>;
}

const BASE32_REGEX = /^[A-Z2-7]+=*$/;

export const validateOTPAuthURI = (uri: string): OTPAuthValidationResult => {
  const errors: OTPAuthValidationError[] = [];

  if (!uri || !uri.trim()) {
    return {
      isValid: false,
      errors: [{ field: 'uri', message: 'URIが空です' }],
    };
  }

  const trimmedUri = uri.trim();

  // Basic format validation
  if (!trimmedUri.startsWith('otpauth://')) {
    errors.push({
      field: 'format',
      message:
        'OTPAuth URIは "otpauth://totp/" または "otpauth://hotp/" で始まる必要があります',
    });
    return { isValid: false, errors };
  }

  // Try to parse the URI
  let parsedData;
  try {
    const url = new URL(trimmedUri);

    // Validate hostname (type)
    const type = url.hostname;
    if (type !== 'totp' && type !== 'hotp') {
      errors.push({
        field: 'type',
        message: 'タイプは "totp" または "hotp" である必要があります',
      });
    }

    // Validate required parameters
    const secret = url.searchParams.get('secret');
    if (!secret) {
      errors.push({
        field: 'secret',
        message: 'secret パラメータは必須です',
      });
    } else {
      // Validate Base32 format
      if (!BASE32_REGEX.test(secret.toUpperCase())) {
        errors.push({
          field: 'secret',
          message:
            'secretは有効なBase32文字列である必要があります (A-Z, 2-7, =)',
        });
      } else {
        // Try to decode Base32
        try {
          b32decode(secret);
        } catch {
          errors.push({
            field: 'secret',
            message: 'secretのBase32デコードに失敗しました',
          });
        }
      }
    }

    // Validate label (issuer and account)
    const label = url.pathname.slice(1);
    if (!label) {
      errors.push({
        field: 'label',
        message: 'ラベル (発行者:アカウント名) は必須です',
      });
    } else {
      const decodedLabel = decodeURIComponent(label);
      if (!decodedLabel.includes(':')) {
        errors.push({
          field: 'label',
          message: 'ラベルは "発行者:アカウント名" の形式である必要があります',
        });
      }
    }

    // Validate optional parameters
    const algorithm = url.searchParams.get('algorithm');
    if (algorithm) {
      const validAlgorithms = ['SHA1', 'SHA256', 'SHA512'];
      if (!validAlgorithms.includes(algorithm.toUpperCase())) {
        errors.push({
          field: 'algorithm',
          message:
            'algorithmは SHA1, SHA256, SHA512 のいずれかである必要があります',
        });
      }
    }

    const digits = url.searchParams.get('digits');
    if (digits) {
      const digitNum = parseInt(digits, 10);
      if (isNaN(digitNum) || digitNum < 1 || digitNum > 10) {
        errors.push({
          field: 'digits',
          message: 'digitsは1から10の間の数値である必要があります',
        });
      }
    }

    if (type === 'totp') {
      const period = url.searchParams.get('period');
      if (period) {
        const periodNum = parseInt(period, 10);
        if (isNaN(periodNum) || periodNum < 1) {
          errors.push({
            field: 'period',
            message: 'periodは正の整数である必要があります',
          });
        }
      }
    }

    if (type === 'hotp') {
      const counter = url.searchParams.get('counter');
      if (counter) {
        const counterNum = parseInt(counter, 10);
        if (isNaN(counterNum) || counterNum < 0) {
          errors.push({
            field: 'counter',
            message: 'counterは0以上の整数である必要があります',
          });
        }
      }
    }

    // If no validation errors, try to parse with the existing function
    if (errors.length === 0) {
      try {
        parsedData = decodeOTPAuthURI(trimmedUri);
      } catch (error) {
        errors.push({
          field: 'parsing',
          message: `URIの解析に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
        });
      }
    }
  } catch (error) {
    errors.push({
      field: 'format',
      message: `不正なURI形式です: ${error instanceof Error ? error.message : '不明なエラー'}`,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    parsedData: errors.length === 0 ? parsedData : undefined,
  };
};

export const getValidationErrorMessage = (
  errors: OTPAuthValidationError[]
): string => {
  if (errors.length === 0) return '';

  // Return the first error message, or combine multiple if needed
  return errors[0].message;
};

export const formatOTPAuthParameters = (
  parsedData: ReturnType<typeof decodeOTPAuthURI>
) => {
  return {
    type: parsedData.type.toUpperCase(),
    issuer: parsedData.issuer,
    accountName: parsedData.accountName,
    algorithm: parsedData.algorithm,
    digits: parsedData.digits.toString(),
    ...(parsedData.type === 'totp'
      ? { period: (parsedData as any).period?.toString() || '30' }
      : { counter: (parsedData as any).counter?.toString() || '1' }),
  };
};
