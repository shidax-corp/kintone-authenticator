export interface ExtensionSettings {
  kintoneBaseUrl: string;
  kintoneUsername: string;
  kintonePassword: string;
  passphrase: string;
  autoFillEnabled: boolean;
}

export interface KintoneRecord {
  recordId: string;
  name: string;
  url: string;
  username: string;
  password: string;
  otpAuthUri: string;
  updatedTime: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface OTPData {
  otp: string;
  remainingTime: number;
}

export type MessageType = 
  | 'READ_QR'
  | 'REGISTER_OTP'
  | 'GET_RECORDS'
  | 'FILL_INPUT'
  | 'GET_OTP'
  | 'COPY_TO_CLIPBOARD'
  | 'GET_SETTINGS'
  | 'SAVE_SETTINGS';

export interface Message {
  type: MessageType;
  data?: any;
}

export interface ReadQRMessage extends Message {
  type: 'READ_QR';
  data: {
    imageUrl: string;
  };
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
    url?: string;
  };
}

export interface FillInputMessage extends Message {
  type: 'FILL_INPUT';
  data: {
    value: string;
    fieldType: 'username' | 'password' | 'otp';
  };
}

export interface GetOTPMessage extends Message {
  type: 'GET_OTP';
  data: {
    recordId: string;
  };
}

export interface CopyToClipboardMessage extends Message {
  type: 'COPY_TO_CLIPBOARD';
  data: {
    text: string;
  };
}