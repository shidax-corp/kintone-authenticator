import { useState } from 'react';

import InputField from '@components/InputField';
import type {
  PromptComponent,
  PromptComponentProps,
} from '@components/Keychain';

/**
 * Popup用のパスコード入力ダイアログ
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

  const handleCancel = async () => {
    await callback(null);
    setPasscode('');
    setError(null);
  };

  if (!shown) return null;

  return (
    <div className="passcode-dialog-overlay">
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
            <button type="button" onClick={handleCancel}>
              キャンセル
            </button>
          </div>
        </form>
      </div>
      <style jsx>{`
        .passcode-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }
        .passcode-dialog {
          background: var(--ka-bg-color);
          padding: 24px;
          border-radius: 8px;
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
    </div>
  );
};

export default PasscodeDialog;
