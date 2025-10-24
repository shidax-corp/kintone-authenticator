import type { TOTP } from '@lib/gen-otp';

export interface ExtensionSettings {
  kintoneBaseUrl: string;
  kintoneAppId: string;
  kintoneUsername: string;
  kintonePassword: string;
  autoFillEnabled: boolean;
  passcodeCacheTimeout: number; // パスコードキャッシュのタイムアウト（分単位）
}

export type MessageType =
  | 'REGISTER_OTP'
  | 'GET_RECORDS'
  | 'GET_OTP'
  | 'GET_SETTINGS'
  | 'TEST_CONNECTION'
  | 'UPDATE_OTP_URI'
  | 'SHOW_ERROR'
  | 'SHOW_FILL_OPTIONS'
  | 'OPEN_REGISTER_FORM'
  | 'FILL_OTP'
  | 'READ_QR_FROM_IMAGE';

export interface Message {
  type: MessageType;
  data?: unknown;
}

export interface RegisterOTPMessage extends Message {
  type: 'REGISTER_OTP';
  data: {
    name: string;
    url: string;
    username: string;
    password: string;
    otpAuthUri?: string;
  };
}

export interface GetRecordsMessage extends Message {
  type: 'GET_RECORDS';
  data?: {
    forceRefresh?: boolean;
  };
}

export interface GetOTPMessage extends Message {
  type: 'GET_OTP';
  data: {
    recordId: string;
  };
}

export interface TestConnectionMessage extends Message {
  type: 'TEST_CONNECTION';
  data: ExtensionSettings;
}

export interface ShowErrorMessage extends Message {
  type: 'SHOW_ERROR';
  data: {
    message: string;
  };
}

export interface ShowFillOptionsMessage extends Message {
  type: 'SHOW_FILL_OPTIONS';
  data: {
    records: kintone.types.SavedFields[];
    currentUrl: string;
  };
}

export interface OpenRegisterFormMessage extends Message {
  type: 'OPEN_REGISTER_FORM';
  data: {
    otpAuthUri: string;
  };
}

export interface FillOTPMessage extends Message {
  type: 'FILL_OTP';
  data: {
    otp: string;
  };
}

export interface ReadQRFromImageMessage extends Message {
  type: 'READ_QR_FROM_IMAGE';
  data: {
    imageUrl: string;
  };
}

export interface UpdateOTPURIMessage extends Message {
  type: 'UPDATE_OTP_URI';
  data: {
    recordId: string;
    otpuri: string;
  };
}

// Response types
export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// GET_OTP response is a TOTP object
export type GetOTPResponse = TOTP;
