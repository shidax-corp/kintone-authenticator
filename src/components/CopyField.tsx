import { type ReactNode, useState } from 'react';
import type { MouseEventHandler } from 'react';

/**
 * テキストをクリップボードにコピーする。
 *
 * @param text - コピーするテキスト。
 * @return Promise<void> - コピーが完了したら解決されるPromise。
 */
export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

/** コピー完了メッセージの表示時間（ミリ秒） */
export const COPIED_MESSAGE_DURATION = 3000;

export interface CopyFieldProps {
  value?: string;
  className?: string;
  copied?: boolean;
  children: ReactNode;
}

/**
 * クリックでテキストをクリップボードにコピーするフィールドコンポーネント。
 *
 * @param value - コピーするテキスト。省略された場合はクリックしても反応しなくなる。
 * @param className - コンポーネントに適用する追加のCSSクラス。
 * @param copied - trueにするとコピー完了のメッセージが表示される。通常は自動で制御されるので指定しなくてもよい。
 * @param children - フィールド内に表示するコンテンツ。
 */
export default function CopyField({
  value,
  className,
  copied = false,
  children,
}: CopyFieldProps) {
  const [autoCopied, setAutoCopied] = useState(false);

  const handleCopy: MouseEventHandler<HTMLDivElement> = () => {
    if (!value) return;

    copyToClipboard(value).then(() => {
      setAutoCopied(true);
      setTimeout(() => setAutoCopied(false), COPIED_MESSAGE_DURATION);
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
          font-size: 10px;
          background-color: var(--ka-bg-dark-color);
          border-radius: 4px;
          padding: 2px 0.5em;
          position: absolute;
          right: 0.5em;
          user-select: none;
          opacity: ${copied || autoCopied ? 1 : 0};
          visibility: ${copied || autoCopied ? 'visible' : 'hidden'};
          transition:
            opacity 0.2s ease,
            visibility 0.2s;
        }
      `}</style>
    </div>
  );
}
