/* global sessionStorage */
import {
  type FC,
  type ReactNode,
  type RefObject,
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react';

import { decrypt, encrypt } from '@lib/crypto';

import MaskedFieldBase from '@components/MaskedField';

// オブジェクトを難読化するときに使うキー。
// 完全なセキュリティを提供するわけではなく、あくまで難読化するだけ。
const OBFUSCATION_KEY = 'kintone-authenticator-obfuscation-key';

// セッションストレージに保存するパスコードのキー。
const PASSCODE_STORAGE_KEY = 'kintone-authenticator-passcodes';

/**
 * パスコードストレージの抽象インターフェース
 *
 * kintone環境ではsessionStorage、Chrome拡張機能ではchrome.storage.localを使用
 */
export interface KeychainStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/**
 * デフォルトのsessionStorage実装
 * kintone環境で使用される
 */
const createSessionStorage = (): KeychainStorage => ({
  async getItem(key: string) {
    return sessionStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    sessionStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    sessionStorage.removeItem(key);
  },
});

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
 *
 * @param passcode 追加・読み取りされたパスコード。
 * @return 処理が完了したときに解決されるPromise。trueなら正しいパスコードとして処理されたことを、falseなら関心のないパスコードか不正なパスコードであったことを示す。
 */
export type PasscodeHandler = (passcode: string) => Promise<boolean>;

interface KeychainContextType {
  loading: boolean;
  passcodes: string[];
  savePasscode: (passcode: string) => Promise<void>;
  setShowPrompt: (shown: boolean) => void;
  handlers: RefObject<Set<PasscodeHandler>>;
}

const KeychainContext = createContext<KeychainContextType>({
  loading: false,
  passcodes: [],
  savePasscode: async () => {},
  setShowPrompt: () => {},
  handlers: { current: new Set<PasscodeHandler>() },
});

export interface PromptComponentProps {
  shown: boolean;
  callback: (passcode: string | null) => Promise<void>;
}

/**
 * パスコードの入力を促すコンポーネントの型
 *
 * @param props コンポーネントのプロパティ
 * @param props.shown コンポーネントを表示するかどうか
 * @param props.callback コンポーネントが閉じられるときに呼ばれるコールバック関数。キャンセルされた場合はnullが渡される。コールバックがエラーを送出した場合はコンポーネントを閉じずにエラーメッセージを表示する。
 */
export type PromptComponent = FC<PromptComponentProps>;

export interface KeychainProps {
  prompt: PromptComponent;
  children: ReactNode;
  storage?: KeychainStorage; // オプショナル、デフォルトはsessionStorage
}

/**
 * 暗号化のためのパスコードを一括管理するためのコンポーネント
 *
 * パスコードは難読化した上でストレージに保存される。
 *
 * @param prompt パスコードの入力を促すコンポーネント
 * @param children 子コンポーネント
 * @param storage パスコードストレージ（省略時はsessionStorage）
 */
export default function Keychain({
  prompt: Prompt,
  children,
  storage,
}: KeychainProps) {
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [passcodes, setPasscodes] = useState<string[]>([]);
  const handlers = useRef<Set<PasscodeHandler>>(new Set());

  // デフォルトのストレージを使用（メモ化して再生成を防ぐ）
  const storageImpl = useMemo(
    () => storage || createSessionStorage(),
    [storage]
  );

  useEffect(() => {
    (async () => {
      try {
        const stored = await storageImpl.getItem(PASSCODE_STORAGE_KEY);
        const obj = await deobfuscate<{ passcodes: string[] }>(stored || '');
        setPasscodes(obj.passcodes || []);
      } catch {
        setPasscodes([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [storageImpl]);

  const savePasscode = async (passcode: string) => {
    if (!passcodes.includes(passcode)) {
      const updatedPasscodes = [...passcodes, passcode];

      const obfuscated = await obfuscate({ passcodes: updatedPasscodes });
      await storageImpl.setItem(PASSCODE_STORAGE_KEY, obfuscated);

      setPasscodes(updatedPasscodes);
    }
  };

  const savePasscodeAndCallHandlers = async (passcode: string) => {
    if (!passcodes.includes(passcode)) {
      await savePasscode(passcode);

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
    <KeychainContext
      value={{
        loading,
        passcodes,
        savePasscode: savePasscodeAndCallHandlers,
        setShowPrompt,
        handlers,
      }}
    >
      {children}

      <Prompt
        shown={showPrompt}
        callback={async (passcode: string | null) => {
          // 入力がキャンセルされた場合は何もせずに閉じるだけ。
          if (!passcode) {
            setShowPrompt(false);
            return;
          }

          let ok = false;
          for (const handler of handlers.current) {
            const k = await handler(passcode);
            if (k) {
              ok = true;
            }
          }

          if (ok) {
            setShowPrompt(false);
            await savePasscode(passcode);
          } else {
            throw new Error('パスコードが違います。');
          }
        }}
      />
    </KeychainContext>
  );
}

/**
 * Keychainからパスコードを取得したり、新たなパスコードを追加したりするためのフック
 *
 * @param onPasscode パスコードが読み取られたか、新たなパスコードが登録されたときに呼ばれるコールバック。
 * @return obj Keychainを操作するための関数やコンポーネントを含むオブジェクト
 * @return obj.savePasscode 新たなパスコードをKeychainに保存する関数
 * @return obj.passcodes 現在Keychainに保存されているパスコードの配列
 * @return obj.MaskedField 暗号化されたフィールドの代わりに表示するダミーコンポーネント。クリックするとパスコード入力ダイアログが表示される。
 */
export function useKeychain(onPasscode: PasscodeHandler) {
  const { loading, savePasscode, passcodes, setShowPrompt, handlers } =
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
        await onPasscode(passcode);
      }
    })();
  });

  useEffect(() => {
    if (!loading) {
      initialCall(onPasscode);
    }
  }, [loading, onPasscode]);

  return {
    savePasscode: async (passcode: string) => {
      for (const handler of handlers.current) {
        await handler(passcode);
      }
      await savePasscode(passcode);
    },
    passcodes,
    MaskedField: (props: { label: string }) => (
      <MaskedFieldBase
        label={props.label}
        onClick={() => setShowPrompt(true)}
      />
    ),
  };
}
