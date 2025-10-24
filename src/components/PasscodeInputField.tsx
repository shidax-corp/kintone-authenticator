import { useState } from 'react';

import LockOnIcon from '@mui/icons-material/Lock';
import LockOffIcon from '@mui/icons-material/NoEncryption';

import Field from '@components/Field';

export interface PasscodeInputFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

/**
 * レコードを暗号化するかどうかのチェックボックスと、暗号化パスコードの入力フィールドを表示するコンポーネント
 *
 * @param value - 現在の暗号化パスコード。無効化されている場合はnullになる。
 * @param onChange - パスコードが変更されたときに呼び出されるコールバック関数。文字列の場合は有効、nullの場合は無効を示す。
 */
export default function PasscodeInputField({
  value,
  onChange,
}: PasscodeInputFieldProps) {
  const enabled = value !== null;
  const passcode = value ?? '';

  const [livePasscode, setLivePasscode] = useState(passcode);

  return (
    <Field label="暗号化パスコード" onClick={() => {}}>
      <label title="パスコードを入力すると、レコードを保存する前にユーザー名、パスワード、ワンタイムパスワードの情報が暗号化されます。">
        <Indicator enabled={enabled} />
        <input
          type="password"
          value={enabled ? livePasscode : ''}
          onChange={(e) => {
            const value = e.target.value;
            setLivePasscode(value);
            onChange(value !== '' ? value : null);
          }}
        />
        <style jsx>{`
          label {
            display: flex;
            align-items: stretch;
            border: 1px solid var(--ka-tint-color);
            color: var(--ka-fg-input-color);
            padding: 0;
          }
          input {
            flex: 1;
            border: none;
            background-color: var(--ka-bg-input-color);
            padding: 0.5em 1em;
            font-size: 1em;
          }
        `}</style>
      </label>
    </Field>
  );
}

const Indicator = ({ enabled }: { enabled: boolean }) => {
  return (
    <div>
      {enabled ? (
        <LockOnIcon aria-label="暗号化は有効です。" />
      ) : (
        <LockOffIcon aria-label="暗号化は無効です。" />
      )}
      <style jsx>{`
        div {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2em;
          padding: 0.5em;
          background-color: ${enabled
            ? 'var(--ka-primary-color)'
            : 'var(--ka-bg-dark-color)'};
        }
        div :global(svg) {
          color: ${enabled ? 'var(--ka-bg-color)' : 'var(--ka-fg-color)'};
        }
      `}</style>
    </div>
  );
};
