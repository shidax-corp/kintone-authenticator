const PASSPHRASE_KEY = 'kintone_authenticator_passphrase';

export const getPassphrase = (): string | null => {
  return localStorage.getItem(PASSPHRASE_KEY);
};

export const setPassphrase = (passphrase: string): void => {
  localStorage.setItem(PASSPHRASE_KEY, passphrase);
};

export const clearPassphrase = (): void => {
  localStorage.removeItem(PASSPHRASE_KEY);
};

export const hasPassphrase = (): boolean => {
  return getPassphrase() !== null;
};