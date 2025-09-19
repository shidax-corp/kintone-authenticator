import type { ReactNode } from 'react';

export interface GlobalStyleOptions {
  tint?: boolean;
}

export interface GlobalStyleProps extends GlobalStyleOptions {
  children: ReactNode;
}

/**
 * 全体で共有するスタイルを定義するコンポーネント
 *
 * @param tint - レコード詳細画面など、背景がやや暗い画面で使う場合に `true` を指定する。
 * @param children - 表示するコンテンツ。
 */
export default function GlobalStyle({ tint, children }: GlobalStyleProps) {
  return (
    <div className="global-style">
      {children}

      <style jsx>{`
        & {
          --ka-fg-rgb: 51, 51, 51;
          --ka-fg-color: rgb(var(--ka-fg-rgb));
          --ka-fg-light-rgb: 102, 102, 102;
          --ka-fg-light-color: rgb(var(--ka-fg-light-rgb));
          --ka-fg-error-rgb: 255, 0, 0;
          --ka-fg-error-color: rgb(var(--ka-fg-error-rgb));

          --ka-bg-rgb: ${tint ? '245, 245, 245' : '255, 255, 255'};
          --ka-bg-color: rgb(var(--ka-bg-rgb));
          --ka-bg-input-rgb: ${tint ? '255, 255, 255' : '250, 250, 250'};
          --ka-bg-input-color: rgb(var(--ka-bg-input-rgb));
          --ka-bg-tint-rgb: ${tint ? '238, 238, 238' : '250, 250, 250'};
          --ka-bg-tint-color: rgb(var(--ka-bg-tint-rgb));
          --ka-bg-dark-rgb: ${tint ? '210, 210, 210' : '220, 220, 220'};
          --ka-bg-dark-color: rgb(var(--ka-bg-dark-rgb));
          --ka-bg-error-rgb: 255, 235, 235;
          --ka-bg-error-color: rgb(var(--ka-bg-error-rgb));

          --ka-primary-rgb: 52, 152, 219;
          --ka-primary-color: rgb(var(--ka-primary-rgb));

          --ka-font-size: 14px;
          --ka-field-padding: 8px 16px;

          color: var(--ka-fg-color);
          font-size: var(--ka-font-size);
          font-family:
            'メイリオ', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif;
        }

        & :global(*) {
          color-scheme: light;
        }
      `}</style>
    </div>
  );
}
