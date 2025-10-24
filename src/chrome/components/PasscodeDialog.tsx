import { useState } from 'react';

import InputField from '@components/InputField';
import type {
  PromptComponent,
  PromptComponentProps,
} from '@components/Keychain';

import ModalBase from './ModalBase';

/**
 * Chrome拡張用のパスコード入力ダイアログ
 * Popup、Contentsの両方で使用される
 */
const PasscodeDialog: PromptComponent = ({
  shown,
  callback,
}: PromptComponentProps) => {
  const [error, setError] = useState<string | null>(null);
  const [passcode, setPasscode] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passcode.trim() === '') {
      setError('パスコードを入力してください。');
      return;
    }

    try {
      await callback(passcode);
      setPasscode('');
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleClose = async () => {
    await callback(null);
    setPasscode('');
    setError(null);
  };

  if (!shown) return null;

  return (
    <ModalBase onClose={handleClose}>
      <div className="passcode-dialog">
        <h2>パスコードを入力してください</h2>
        <form onSubmit={handleSubmit}>
          <InputField
            type="password"
            label="パスコード"
            value={passcode}
            onChange={setPasscode}
            required
          />
          {error && <div className="error">{error}</div>}
          <div className="buttons">
            <button type="submit">OK</button>
            <button type="button" onClick={handleClose}>
              キャンセル
            </button>
          </div>
        </form>
      </div>
      <style jsx>{`
        .passcode-dialog {
          padding: 24px;
          min-width: 300px;
          max-width: 400px;
        }
        h2 {
          margin: 0 0 16px;
          font-size: 1.2em;
        }
        .error {
          color: red;
          margin-top: 8px;
          font-size: 0.9em;
        }
        .buttons {
          display: flex;
          gap: 8px;
          margin-top: 16px;
          justify-content: flex-end;
        }
        button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1em;
        }
        button[type='submit'] {
          background: var(--ka-primary-color);
          color: white;
        }
        button[type='button'] {
          background: var(--ka-bg-tint-color);
        }
      `}</style>
    </ModalBase>
  );
};

export default PasscodeDialog;
