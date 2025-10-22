import { useState } from 'react';

import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { decrypt, encrypt } from '@lib/crypto';

import Keychain, {
  type PromptComponent,
  type PromptComponentProps,
  useKeychain,
} from './Keychain';

// オブジェクトを難読化するときに使うキー（Keychain.tsxと同じ）
const OBFUSCATION_KEY = 'kintone-authenticator-obfuscation-key';
const PASSCODE_STORAGE_KEY = 'kintone-authenticator-passcodes';

async function obfuscate(obj: Record<string, unknown>): Promise<string> {
  const json = JSON.stringify(obj);
  return await encrypt(json, OBFUSCATION_KEY);
}

async function deobfuscate<T extends Record<string, unknown>>(
  str: string
): Promise<T> {
  if (!str) {
    throw new Error('Deobfuscation failed: input string is empty');
  }
  const json = await decrypt(str, OBFUSCATION_KEY);
  return JSON.parse(json) as T;
}

describe('Keychain', () => {
  let mockSessionStorage: Record<string, string> = {};

  beforeEach(() => {
    mockSessionStorage = {};

    // sessionStorageのモック
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn((key: string) => mockSessionStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockSessionStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockSessionStorage[key];
        }),
        clear: jest.fn(() => {
          mockSessionStorage = {};
        }),
      },
      writable: true,
    });
  });

  describe('sessionStorageとの統合', () => {
    it('should load passcodes from sessionStorage on mount', async () => {
      const passcodes = ['passcode1', 'passcode2'];
      const obfuscated = await obfuscate({ passcodes });
      mockSessionStorage[PASSCODE_STORAGE_KEY] = obfuscated;

      const handler = jest.fn().mockResolvedValue(true);
      const MockPrompt: PromptComponent = () => null;

      function TestComponent() {
        useKeychain(handler);
        return <div>Test</div>;
      }

      render(
        <Keychain prompt={MockPrompt}>
          <TestComponent />
        </Keychain>
      );

      // useEffectの実行を待つ（loadingとinitialCallの両方）
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // ハンドラーが既存のパスコードで呼ばれることを確認
      expect(handler).toHaveBeenCalledWith('passcode1');
      expect(handler).toHaveBeenCalledWith('passcode2');
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should save passcode to sessionStorage', async () => {
      const handler = jest.fn().mockResolvedValue(true);
      const MockPrompt: PromptComponent = () => null;

      function TestComponent() {
        const { savePasscode } = useKeychain(handler);
        return (
          <button onClick={() => savePasscode('new-passcode')}>Save</button>
        );
      }

      render(
        <Keychain prompt={MockPrompt}>
          <TestComponent />
        </Keychain>
      );

      // 初期化を待つ
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // パスコードを保存
      const button = screen.getByText('Save');
      await act(async () => {
        fireEvent.click(button);
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // sessionStorageに保存されたことを確認
      expect(mockSessionStorage[PASSCODE_STORAGE_KEY]).toBeDefined();
      const stored = await deobfuscate<{ passcodes: string[] }>(
        mockSessionStorage[PASSCODE_STORAGE_KEY]
      );
      expect(stored.passcodes).toContain('new-passcode');
    });

    it('should handle corrupted sessionStorage data gracefully', async () => {
      mockSessionStorage[PASSCODE_STORAGE_KEY] = 'corrupted-data';

      const handler = jest.fn().mockResolvedValue(true);
      const MockPrompt: PromptComponent = () => null;

      function TestComponent() {
        useKeychain(handler);
        return <div>Test</div>;
      }

      // エラーが発生せずにレンダリングできることを確認
      expect(() => {
        render(
          <Keychain prompt={MockPrompt}>
            <TestComponent />
          </Keychain>
        );
      }).not.toThrow();

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // ハンドラーが呼ばれないことを確認（パスコードがないため）
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('PromptComponentとの統合', () => {
    it('should show prompt when MaskedField is clicked', async () => {
      const handler = jest.fn().mockResolvedValue(true);

      const MockPrompt: PromptComponent = ({ shown }: PromptComponentProps) => {
        return shown ? <div>Prompt shown</div> : null;
      };

      function TestComponent() {
        const { MaskedField } = useKeychain(handler);
        return <MaskedField label="Test Field" />;
      }

      render(
        <Keychain prompt={MockPrompt}>
          <TestComponent />
        </Keychain>
      );

      // 初期化を待つ
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(screen.queryByText('Prompt shown')).not.toBeInTheDocument();

      // MaskedFieldのボタンをクリック
      const button = screen.getByLabelText('暗号化を解除する');
      await act(async () => {
        fireEvent.click(button);
      });

      expect(screen.getByText('Prompt shown')).toBeInTheDocument();
    });

    it('should close prompt when correct passcode is entered', async () => {
      const handler = jest.fn().mockResolvedValue(true);

      const MockPrompt: PromptComponent = ({
        shown,
        callback,
      }: PromptComponentProps) => {
        return shown ? (
          <div>
            <div>Prompt shown</div>
            <button onClick={() => callback('correct-passcode')}>Submit</button>
          </div>
        ) : null;
      };

      function TestComponent() {
        const { MaskedField } = useKeychain(handler);
        return <MaskedField label="Test Field" />;
      }

      render(
        <Keychain prompt={MockPrompt}>
          <TestComponent />
        </Keychain>
      );

      // 初期化を待つ
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // MaskedFieldのボタンをクリック
      const button = screen.getByLabelText('暗号化を解除する');
      await act(async () => {
        fireEvent.click(button);
      });

      expect(screen.getByText('Prompt shown')).toBeInTheDocument();

      // 正しいパスコードを入力
      const submitButton = screen.getByText('Submit');
      await act(async () => {
        fireEvent.click(submitButton);
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Promptが閉じられたことを確認
      expect(screen.queryByText('Prompt shown')).not.toBeInTheDocument();
      expect(handler).toHaveBeenCalledWith('correct-passcode');
    });

    it('should show error when incorrect passcode is entered', async () => {
      const handler = jest.fn().mockResolvedValue(false);
      let error: Error | null = null;

      const MockPrompt: PromptComponent = ({
        shown,
        callback,
      }: PromptComponentProps) => {
        return shown ? (
          <div>
            <div>Prompt shown</div>
            <button
              onClick={async () => {
                try {
                  await callback('wrong-passcode');
                } catch (e) {
                  error = e as Error;
                }
              }}
            >
              Submit
            </button>
          </div>
        ) : null;
      };

      function TestComponent() {
        const { MaskedField } = useKeychain(handler);
        return <MaskedField label="Test Field" />;
      }

      render(
        <Keychain prompt={MockPrompt}>
          <TestComponent />
        </Keychain>
      );

      // 初期化を待つ
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // MaskedFieldのボタンをクリック
      const button = screen.getByLabelText('暗号化を解除する');
      await act(async () => {
        fireEvent.click(button);
      });

      // 間違ったパスコードを入力
      const submitButton = screen.getByText('Submit');
      await act(async () => {
        fireEvent.click(submitButton);
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // エラーが発生していることを確認
      expect(error).not.toBeNull();
      expect(error!.message).toBe('パスコードが違います。');
      // Promptが閉じられていないことを確認
      expect(screen.getByText('Prompt shown')).toBeInTheDocument();
    });

    it('should close prompt when cancelled', async () => {
      const handler = jest.fn().mockResolvedValue(true);

      const MockPrompt: PromptComponent = ({
        shown,
        callback,
      }: PromptComponentProps) => {
        return shown ? (
          <div>
            <div>Prompt shown</div>
            <button onClick={() => callback(null)}>Cancel</button>
          </div>
        ) : null;
      };

      function TestComponent() {
        const { MaskedField } = useKeychain(handler);
        return <MaskedField label="Test Field" />;
      }

      render(
        <Keychain prompt={MockPrompt}>
          <TestComponent />
        </Keychain>
      );

      // 初期化を待つ
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // MaskedFieldのボタンをクリック
      const button = screen.getByLabelText('暗号化を解除する');
      await act(async () => {
        fireEvent.click(button);
      });

      expect(screen.getByText('Prompt shown')).toBeInTheDocument();

      // キャンセル
      const cancelButton = screen.getByText('Cancel');
      await act(async () => {
        fireEvent.click(cancelButton);
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Promptが閉じられたことを確認
      expect(screen.queryByText('Prompt shown')).not.toBeInTheDocument();
      // ハンドラーが呼ばれていないことを確認（初期化時以外）
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('useKeychainフック', () => {
    it('should call handler with existing passcodes on initialization', async () => {
      const passcodes = ['existing-passcode'];
      const obfuscated = await obfuscate({ passcodes });
      mockSessionStorage[PASSCODE_STORAGE_KEY] = obfuscated;

      const handler = jest.fn().mockResolvedValue(true);
      const MockPrompt: PromptComponent = () => null;

      function TestComponent() {
        useKeychain(handler);
        return <div>Test</div>;
      }

      render(
        <Keychain prompt={MockPrompt}>
          <TestComponent />
        </Keychain>
      );

      // 初期化を待つ
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(handler).toHaveBeenCalledWith('existing-passcode');
    });

    it('should not save duplicate passcodes', async () => {
      const handler = jest.fn().mockResolvedValue(true);
      const MockPrompt: PromptComponent = () => null;

      function TestComponent() {
        const { savePasscode } = useKeychain(handler);
        return (
          <div>
            <button onClick={() => savePasscode('same-passcode')}>Save1</button>
            <button onClick={() => savePasscode('same-passcode')}>Save2</button>
          </div>
        );
      }

      render(
        <Keychain prompt={MockPrompt}>
          <TestComponent />
        </Keychain>
      );

      // 初期化を待つ
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // 同じパスコードを2回保存
      const button1 = screen.getByText('Save1');
      await act(async () => {
        fireEvent.click(button1);
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const button2 = screen.getByText('Save2');
      await act(async () => {
        fireEvent.click(button2);
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // sessionStorageに保存されたパスコードを確認
      const stored = await deobfuscate<{ passcodes: string[] }>(
        mockSessionStorage[PASSCODE_STORAGE_KEY]
      );
      expect(stored.passcodes).toHaveLength(1);
      expect(stored.passcodes[0]).toBe('same-passcode');
    });

    it('should return MaskedField component', async () => {
      const handler = jest.fn().mockResolvedValue(true);
      const MockPrompt: PromptComponent = () => null;

      function TestComponent() {
        const { MaskedField } = useKeychain(handler);
        return <MaskedField label="Masked Field Test" />;
      }

      render(
        <Keychain prompt={MockPrompt}>
          <TestComponent />
        </Keychain>
      );

      // 初期化を待つ
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(screen.getByText('Masked Field Test')).toBeInTheDocument();
    });
  });

  describe('PasscodeHandler', () => {
    it('should accept passcode when handler returns true', async () => {
      const handler = jest.fn().mockResolvedValue(true);

      const MockPrompt: PromptComponent = ({
        shown,
        callback,
      }: PromptComponentProps) => {
        return shown ? (
          <div>
            <button onClick={() => callback('valid-passcode')}>Submit</button>
          </div>
        ) : null;
      };

      function TestComponent() {
        const { MaskedField } = useKeychain(handler);
        return <MaskedField label="Test Field" />;
      }

      render(
        <Keychain prompt={MockPrompt}>
          <TestComponent />
        </Keychain>
      );

      // 初期化を待つ
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // MaskedFieldのボタンをクリック
      const button = screen.getByLabelText('暗号化を解除する');
      await act(async () => {
        fireEvent.click(button);
      });

      // パスコードを入力
      const submitButton = screen.getByText('Submit');
      await act(async () => {
        fireEvent.click(submitButton);
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // パスコードが保存されたことを確認
      expect(mockSessionStorage[PASSCODE_STORAGE_KEY]).toBeDefined();
      const stored = await deobfuscate<{ passcodes: string[] }>(
        mockSessionStorage[PASSCODE_STORAGE_KEY]
      );
      expect(stored.passcodes).toContain('valid-passcode');
    });

    it('should reject passcode when handler returns false', async () => {
      const handler = jest.fn().mockResolvedValue(false);
      let error: Error | null = null;

      const MockPrompt: PromptComponent = ({
        shown,
        callback,
      }: PromptComponentProps) => {
        return shown ? (
          <div>
            <button
              onClick={async () => {
                try {
                  await callback('invalid-passcode');
                } catch (e) {
                  error = e as Error;
                }
              }}
            >
              Submit
            </button>
          </div>
        ) : null;
      };

      function TestComponent() {
        const { MaskedField } = useKeychain(handler);
        return <MaskedField label="Test Field" />;
      }

      render(
        <Keychain prompt={MockPrompt}>
          <TestComponent />
        </Keychain>
      );

      // 初期化を待つ
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // MaskedFieldのボタンをクリック
      const button = screen.getByLabelText('暗号化を解除する');
      await act(async () => {
        fireEvent.click(button);
      });

      // パスコードを入力
      const submitButton = screen.getByText('Submit');
      await act(async () => {
        fireEvent.click(submitButton);
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // エラーが発生していることを確認
      expect(error).not.toBeNull();
      expect(error!.message).toBe('パスコードが違います。');
    });

    it('should accept passcode when at least one handler returns true', async () => {
      const handler1 = jest.fn().mockResolvedValue(false);
      const handler2 = jest.fn().mockResolvedValue(true);
      const handler3 = jest.fn().mockResolvedValue(false);

      const MockPrompt: PromptComponent = ({
        shown,
        callback,
      }: PromptComponentProps) => {
        return shown ? (
          <div>
            <button onClick={() => callback('passcode')}>Submit</button>
          </div>
        ) : null;
      };

      function TestComponent() {
        const { MaskedField: MaskedField1 } = useKeychain(handler1);
        useKeychain(handler2);
        useKeychain(handler3);
        return (
          <div>
            <MaskedField1 label="Field 1" />
          </div>
        );
      }

      render(
        <Keychain prompt={MockPrompt}>
          <TestComponent />
        </Keychain>
      );

      // 初期化を待つ
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // MaskedFieldのボタンをクリック
      const button = screen.getByLabelText('暗号化を解除する');
      await act(async () => {
        fireEvent.click(button);
      });

      // パスコードを入力
      const submitButton = screen.getByText('Submit');
      await act(async () => {
        fireEvent.click(submitButton);
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // すべてのハンドラーが呼ばれたことを確認
      expect(handler1).toHaveBeenCalledWith('passcode');
      expect(handler2).toHaveBeenCalledWith('passcode');
      expect(handler3).toHaveBeenCalledWith('passcode');

      // パスコードが保存されたことを確認（少なくとも1つがtrueを返したため）
      expect(mockSessionStorage[PASSCODE_STORAGE_KEY]).toBeDefined();
      const stored = await deobfuscate<{ passcodes: string[] }>(
        mockSessionStorage[PASSCODE_STORAGE_KEY]
      );
      expect(stored.passcodes).toContain('passcode');
    });
  });

  describe('複数のハンドラー', () => {
    it('should call all handlers when passcode is saved', async () => {
      const handler1 = jest.fn().mockResolvedValue(true);
      const handler2 = jest.fn().mockResolvedValue(true);
      const MockPrompt: PromptComponent = () => null;

      function TestComponent() {
        const { savePasscode: savePasscode1 } = useKeychain(handler1);
        useKeychain(handler2);
        return <button onClick={() => savePasscode1('passcode')}>Save</button>;
      }

      render(
        <Keychain prompt={MockPrompt}>
          <TestComponent />
        </Keychain>
      );

      // 初期化を待つ
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // パスコードを保存
      const button = screen.getByText('Save');
      await act(async () => {
        fireEvent.click(button);
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // すべてのハンドラーが呼ばれたことを確認
      expect(handler1).toHaveBeenCalledWith('passcode');
      expect(handler2).toHaveBeenCalledWith('passcode');
    });

    it('should cleanup handlers on unmount', async () => {
      const handler = jest.fn().mockResolvedValue(true);
      const MockPrompt: PromptComponent = () => null;

      function TestComponent({ show }: { show: boolean }) {
        return show ? <ChildComponent /> : null;
      }

      function ChildComponent() {
        useKeychain(handler);
        return <div>Child</div>;
      }

      function ParentComponent() {
        const [show, setShow] = useState(true);
        return (
          <Keychain prompt={MockPrompt}>
            <div>
              <TestComponent show={show} />
              <button onClick={() => setShow(false)}>Unmount</button>
            </div>
          </Keychain>
        );
      }

      render(<ParentComponent />);

      // 初期化を待つ
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // コンポーネントをアンマウント
      const button = screen.getByText('Unmount');
      await act(async () => {
        fireEvent.click(button);
      });

      // ハンドラーがクリーンアップされたことを確認（エラーが発生しない）
      expect(screen.queryByText('Child')).not.toBeInTheDocument();
    });
  });
});
