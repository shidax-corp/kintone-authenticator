import React, { ReactNode, useState } from 'react';
import type { MouseEventHandler } from 'react';

export interface CopyFieldProps {
  value?: string;
  className?: string;
  children: ReactNode;
}

/**
 * クリックでテキストをクリップボードにコピーするフィールドコンポーネント。
 *
 * @param value - コピーするテキスト。省略された場合はクリックしても反応しなくなる。
 * @param className - コンポーネントに適用する追加のCSSクラス。
 * @param children - フィールド内に表示するコンテンツ。通常はコピー対象のテキスト。
 */
export default function CopyField({
  value,
  className,
  children,
}: CopyFieldProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy: MouseEventHandler<HTMLDivElement> = () => {
    if (!value) return;

    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div
      onClick={handleCopy}
      className={className}
      style={{ cursor: value ? 'pointer' : undefined }}
    >
      {children}
      <span>コピーしました</span>
      <style jsx>{`
        div {
          position: relative;
          user-select: all;
          padding: var(--ka-field-padding);
        }

        span {
          font-size: 70%;
          background-color: var(--ka-bg-dark-color);
          border: 1px solid var(rgba(var(--ka-fg-rgb), 0.8));
          border-radius: 4px;
          padding: 2px 0.5em;
          position: absolute;
          right: 0.5em;
          user-select: none;
          opacity: ${copied ? 1 : 0};
          visibility: ${copied ? 'visible' : 'hidden'};
          transition:
            opacity 0.2s ease,
            visibility 0.2s;
        }
      `}</style>
    </div>
  );
}
