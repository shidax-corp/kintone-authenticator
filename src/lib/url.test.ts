import { extractOriginURL, isValidURL, isValidURLPattern } from './url';

describe('url utilities', () => {
  describe('isValidURL', () => {
    test('有効なHTTPSのURLの場合、trueを返す', () => {
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('https://github.com/user/repo')).toBe(true);
    });

    test('有効なHTTPのURLの場合、trueを返す', () => {
      expect(isValidURL('http://example.com')).toBe(true);
    });

    test('無効なURLの場合、falseを返す', () => {
      expect(isValidURL('invalid-url')).toBe(false);
      expect(isValidURL('')).toBe(false);
      expect(isValidURL('ftp://example.com')).toBe(true); // FTPは有効なURL
    });
  });

  describe('isValidURLPattern', () => {
    test('有効なURLパターンの場合、trueを返す', () => {
      expect(isValidURLPattern('https://example.com/*')).toBe(true);
      expect(isValidURLPattern('example.com/*')).toBe(true);
    });

    test('無効なURLパターンの場合、falseを返す', () => {
      expect(isValidURLPattern('')).toBe(false);
    });
  });

  describe('extractOriginURL', () => {
    test('完全なURLからオリジンを抽出する', () => {
      expect(
        extractOriginURL('https://github.com/shidax-corp/kintone-authenticator')
      ).toBe('https://github.com/');
      expect(extractOriginURL('https://accounts.google.com/signin/oauth')).toBe(
        'https://accounts.google.com/'
      );
      expect(extractOriginURL('http://localhost:8080/app/dashboard')).toBe(
        'http://localhost:8080/'
      );
    });

    test('クエリパラメータがある場合も正しく処理する', () => {
      expect(
        extractOriginURL('https://example.com/path?param=value&other=test')
      ).toBe('https://example.com/');
    });

    test('フラグメントがある場合も正しく処理する', () => {
      expect(extractOriginURL('https://example.com/path#section')).toBe(
        'https://example.com/'
      );
    });

    test('ポート番号がある場合も正しく処理する', () => {
      expect(extractOriginURL('https://example.com:3000/app')).toBe(
        'https://example.com:3000/'
      );
    });

    test('すでにオリジンのみのURLの場合、そのまま返す', () => {
      expect(extractOriginURL('https://github.com/')).toBe(
        'https://github.com/'
      );
      expect(extractOriginURL('https://github.com')).toBe(
        'https://github.com/'
      );
    });

    test('無効なURLの場合、元のURLを返す', () => {
      expect(extractOriginURL('invalid-url')).toBe('invalid-url');
      expect(extractOriginURL('')).toBe('');
      expect(extractOriginURL(undefined)).toBe('');
    });
  });
});
