/* global sessionStorage */
import { decrypt, encrypt } from '@lib/crypto';

// オブジェクトを難読化するときに使うキー。
// 完全なセキュリティを提供するわけではなく、あくまで難読化するだけ。
const OBFUSCATION_KEY = 'kintone-authenticator-obfuscation-key';

// セッションストレージに保存するパスコードのキー。
const PASSCODE_STORAGE_KEY = 'kintone-authenticator-passcodes';

/**
 * オブジェクトを簡易的に難読化して文字列に変換する。
 *
 * @param obj 難読化するオブジェクト
 * @returns 難読化された文字列
 */
async function obfuscate(obj: Record<string, unknown>): Promise<string> {
  const json = JSON.stringify(obj);
  return await encrypt(json, OBFUSCATION_KEY);
}

/**
 * 難読化された文字列を元のオブジェクトに復元する。
 *
 * @param str 難読化された文字列
 * @returns 復元されたオブジェクト
 */
async function deobfuscate<T extends Record<string, unknown>>(
  str: string
): Promise<T> {
  if (!str) {
    throw new Error('Deobfuscation failed: input string is empty');
  }
  const json = await decrypt(str, OBFUSCATION_KEY);
  return JSON.parse(json) as T;
}

/**
 * セッションストレージに保存したパスコードを読み取る。
 */
export async function getPasscodes(): Promise<string[]> {
  const stored = sessionStorage.getItem(PASSCODE_STORAGE_KEY);
  try {
    const obj = await deobfuscate<{ passcodes: string[] }>(stored || '');
    return obj.passcodes || [];
  } catch {
    return [];
  }
}

/**
 * セッションストレージにパスコードを追加する。
 *
 * @param passcode 追加するパスコード
 */
export async function savePasscode(passcode: string): Promise<void> {
  const passcodes = await getPasscodes();
  if (passcodes.includes(passcode)) {
    return;
  }
  passcodes.push(passcode);
  const obfuscated = await obfuscate({ passcodes });
  sessionStorage.setItem(PASSCODE_STORAGE_KEY, obfuscated);
}
