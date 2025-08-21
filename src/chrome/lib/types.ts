export interface ExtensionSettings {
  kintoneBaseUrl: string;
  kintoneUsername: string;
  kintonePassword: string;
  kintoneAppId: string;
  autoFillEnabled: boolean;
}

export type MessageType =
  | 'READ_QR'
  | 'REGISTER_OTP'
  | 'GET_RECORDS'
  | 'GET_OTP'
  | 'GET_SETTINGS'
  | 'SAVE_SETTINGS'
  | 'TEST_CONNECTION';

export interface Message {
  type: MessageType;
  data?: unknown;
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
