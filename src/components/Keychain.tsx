/* global sessionStorage */
import {
  type ReactNode,
  type RefObject,
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react';

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
 * パスコードが追加・読み取りされたときのハンドラーの型
 */
export type PasscodeHandler = (passcode: string) => void | Promise<void>;

interface KeychainContextType {
  loading: boolean;
  passcodes: string[];
  savePasscode: (passcode: string) => Promise<void>;
  handlers: RefObject<Set<PasscodeHandler>>;
}

const KeychainContext = createContext<KeychainContextType>({
  loading: false,
  passcodes: [],
  savePasscode: async () => {},
  handlers: { current: new Set<PasscodeHandler>() },
});

export interface KeychainProps {
  children: ReactNode;
}

/**
 * 暗号化のためのパスコードを一括管理するためのコンポーネント
 *
 * パスコードは難読化した上でセッションストレージに保存される。
 */
export default function Keychain({ children }: KeychainProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [passcodes, setPasscodes] = useState<string[]>([]);
  const handlers = useRef<Set<PasscodeHandler>>(new Set());

  useEffect(() => {
    const stored = sessionStorage.getItem(PASSCODE_STORAGE_KEY);
    deobfuscate<{ passcodes: string[] }>(stored || '')
      .catch(() => ({ passcodes: [] }))
      .then((obj) => {
        setPasscodes(obj.passcodes || []);
        setLoading(false);
      });
  }, []);

  const savePasscode = async (passcode: string) => {
    if (!passcodes.includes(passcode)) {
      const updatedPasscodes = [...passcodes, passcode];

      const obfuscated = await obfuscate({ passcodes: updatedPasscodes });
      sessionStorage.setItem(PASSCODE_STORAGE_KEY, obfuscated);

      setPasscodes(updatedPasscodes);

      for (const handler of handlers.current) {
        try {
          await handler(passcode);
        } catch {
          // ハンドラー内でエラーが発生しても無視する
        }
      }
    }
  };

  return (
    <KeychainContext value={{ loading, passcodes, savePasscode, handlers }}>
      {children}
    </KeychainContext>
  );
}

/**
 * Keychainからパスコードを取得したり、新たなパスコードを追加したりするためのフック
 *
 * @param onPasscode パスコードが読み取られたか、新たなパスコードが登録されたときに呼ばれるコールバック。
 */
export function useKeychain(onPasscode: PasscodeHandler) {
  const { loading, passcodes, savePasscode, handlers } =
    useContext(KeychainContext);

  useEffect(() => {
    const hs = handlers.current;

    hs.add(onPasscode);

    return () => {
      hs.delete(onPasscode);
    };
  }, [onPasscode, handlers]);

  const initialCall = useEffectEvent((onPasscode: PasscodeHandler) => {
    (async () => {
      for (const passcode of passcodes) {
        try {
          await onPasscode(passcode);
        } catch {
          // ハンドラー内でエラーが発生しても無視する
        }
      }
    })();
  });

  useEffect(() => {
    if (!loading) {
      initialCall(onPasscode);
    }
  }, [loading, onPasscode]);

  return { passcodes, savePasscode };
}
