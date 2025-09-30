export interface ExtensionSettings {
  kintoneBaseUrl: string;
  kintoneAppId: string;
  kintoneUsername: string;
  kintonePassword: string;
  autoFillEnabled: boolean;
}

export type MessageType =
  | 'REGISTER_OTP'
  | 'GET_RECORDS'
  | 'GET_OTP'
  | 'GET_SETTINGS'
  | 'TEST_CONNECTION';

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
