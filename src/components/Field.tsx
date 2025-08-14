import React, { ReactNode } from 'react';

export interface FieldProps {
  label: ReactNode;
  onClick?: () => void;
  children: ReactNode;
}

/**
 * シンプルなフィールドとラベルを表示するコンポーネント。
 *
 * @param label - フィールドの上に表示するラベル。
 * @param onClick - フィールドコンテンツがクリックされたときのコールバック関数。
 * @param children - フィールドの内容として表示するコンテンツ。
 */
export default function Field({ label, onClick, children }: FieldProps) {
  return (
    <div onClick={onClick}>
      <span>{label}</span>
      <div>{children}</div>
      <style jsx>{`
        span {
          font-size: 80%;
          color: var(--ka-fg-light-color);
          pointer: ${onClick ? 'cursor' : 'default'};
        }
        div > div {
          background-color: var(--ka-bg-tint-color);
          position: relative;
        }
      `}</style>
    </div>
  );
}
