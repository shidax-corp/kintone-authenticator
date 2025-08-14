import React, { ReactNode } from 'react';

export interface GlobalStyleProps {
  children: ReactNode;
}

export default function GlobalStyle({ children }: GlobalStyleProps) {
  return (
    <div className="global-style">
      {children}

      <style jsx>{`
        & {
          --ka-fg-rgb: 51, 51, 51;
          --ka-fg-color: rgb(var(--ka-fg-rgb));
          --ka-fg-light-rgb: 102, 102, 102;
          --ka-fg-light-color: rgb(var(--ka-fg-light-rgb));

          --ka-bg-tint-rgb: 250, 250, 250;
          --ka-bg-tint-color: rgb(var(--ka-bg-tint-rgb));
          --ka-bg-dark-rgb: 220, 220, 220;
          --ka-bg-dark-color: rgb(var(--ka-bg-dark-rgb));

          --ka-primary-rgb: 0, 123, 255;
          --ka-primary-color: rgb(var(--ka-primary-rgb));

          --ka-field-padding: 8px 16px;

          color: var(--ka-fg-color);
        }
      `}</style>
    </div>
  );
}
