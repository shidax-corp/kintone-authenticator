import type { ReactNode } from 'react';

export interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  bg?: string;
  fg?: string;
}

/**
 * 汎用的なボタンコンポーネント。
 *
 * @param children - ボタン内に表示するコンテンツ。通常はテキストやアイコンを指定する。
 * @param onClick - ボタンがクリックされたときに呼び出されるコールバック関数。
 * @param disabled - ボタンを無効化するかどうか。
 * @param bg - ボタンの背景色。CSS変数名を指定する。
 * @param fg - ボタンの文字色。CSS変数名を指定する。
 */
export default function Button({
  children,
  onClick = () => {},
  disabled = false,
  bg = '--ka-primary-color',
  fg = '--ka-bg-color',
}: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
      <style jsx>{`
        button {
          padding: 12px 32px;
          border: none;
          border-radius: none;
          cursor: pointer;
          background-color: var(${bg});
          color: var(${fg});
          font-size: 16px;
        }
        button:hover,
        button:active {
          background-color: color-mix(in srgb, var(${bg}) 90%, #000);
        }
        button:disabled {
          background-color: var(--ka-bg-tint-color);
          cursor: default;
        }
      `}</style>
    </button>
  );
}
