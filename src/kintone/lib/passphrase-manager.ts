const PASSPHRASE_KEY = 'kintone_authenticator_passphrase';

export class PassphraseManager {
  static save(passphrase: string): void {
    localStorage.setItem(PASSPHRASE_KEY, passphrase);
  }

  static get(): string | null {
    return localStorage.getItem(PASSPHRASE_KEY);
  }

  static remove(): void {
    localStorage.removeItem(PASSPHRASE_KEY);
  }

  static isSet(): boolean {
    return localStorage.getItem(PASSPHRASE_KEY) !== null;
  }
}