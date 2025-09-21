import { isValidKintoneAppUrl, parseKintoneAppUrl } from './kintone-url';

describe('parseKintoneAppUrl', () => {
  it('正常なkintoneアプリURLをパースできる', () => {
    const result = parseKintoneAppUrl('https://example.cybozu.com/k/123/');
    expect(result).toEqual({
      kintoneBaseUrl: 'https://example.cybozu.com',
      kintoneAppId: '123',
    });
  });

  it('末尾にスラッシュがなくてもパースできる', () => {
    const result = parseKintoneAppUrl('https://example.cybozu.com/k/456');
    expect(result).toEqual({
      kintoneBaseUrl: 'https://example.cybozu.com',
      kintoneAppId: '456',
    });
  });

  it('前後の空白文字を無視する', () => {
    const result = parseKintoneAppUrl('  https://example.cybozu.com/k/789/  ');
    expect(result).toEqual({
      kintoneBaseUrl: 'https://example.cybozu.com',
      kintoneAppId: '789',
    });
  });

  it('空文字列でエラーを投げる', () => {
    expect(() => parseKintoneAppUrl('')).toThrow(
      'アプリURLが入力されていません'
    );
  });

  it('無効なURLでエラーを投げる', () => {
    expect(() => parseKintoneAppUrl('invalid-url')).toThrow(
      '有効なURLを入力してください'
    );
  });

  it('HTTPでエラーを投げる', () => {
    expect(() =>
      parseKintoneAppUrl('http://example.cybozu.com/k/123/')
    ).toThrow('HTTPSのURLを入力してください');
  });

  it('kintoneアプリでないURLでエラーを投げる', () => {
    expect(() => parseKintoneAppUrl('https://example.com/path')).toThrow(
      'kintone アプリのURLを入力してください'
    );
  });

  it('アプリIDが数字でない場合エラーを投げる', () => {
    expect(() =>
      parseKintoneAppUrl('https://example.cybozu.com/k/abc/')
    ).toThrow('kintone アプリのURLを入力してください');
  });
});

describe('isValidKintoneAppUrl', () => {
  it('有効なURLでtrueを返す', () => {
    expect(isValidKintoneAppUrl('https://example.cybozu.com/k/123/')).toBe(
      true
    );
  });

  it('無効なURLでfalseを返す', () => {
    expect(isValidKintoneAppUrl('invalid-url')).toBe(false);
    expect(isValidKintoneAppUrl('https://example.com/path')).toBe(false);
    expect(isValidKintoneAppUrl('')).toBe(false);
  });
});
