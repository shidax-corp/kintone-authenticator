import type { ReactNode } from 'react';

import LockIcon from '@mui/icons-material/Lock';

import Field from '@components/Field';

export interface EncryptedFieldMaskProps {
  label: ReactNode;
  onClick?: () => void;
}

/**
 * 暗号化されたフィールドの代わりに表示するコンポーネント。
 *
 * @param label - フィールドの上に表示するラベル。
 * @param onClick - フィールドがクリックされたときに呼び出されるコールバック関数。
 */
export default function EncryptedFieldMask({
  label,
  onClick,
}: EncryptedFieldMaskProps) {
  return (
    <Field label={label}>
      <button type="button" onClick={onClick} aria-label="暗号化を解除する">
        <div>
          <LockIcon />
        </div>
        <span>●●●●●●●●</span>
      </button>
      <style jsx>{`
        button {
          display: flex;
          align-items: stretch;
          color: var(--ka-fg-color);
          background-color: var(--ka-bg-tint-color);
          border: none;
          border-radius: 0;
          margin: 0;
          padding: 0;
          width: 100%;
          text-align: left;
        }
        span {
          flex: 1;
          margin: 0;
          padding: 0.5em 1em;
        }
        div {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2em;
          padding: 0.5em;
          background-color: var(--ka-bg-dark-color);
        }
        div :global(svg) {
          color: var(--ka-fg-color);
        }
      `}</style>
    </Field>
  );
}
