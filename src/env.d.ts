/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    OBFUSCATION_KEY?: string;
    PASSCODE_STORAGE_KEY?: string;
    LAST_ACCESS_STORAGE_KEY?: string;
  }
}
