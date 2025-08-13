import React, { CSSProperties, useState } from 'react';
import type { MouseEventHandler } from 'react';

export interface CopyBlockProps {
  disabled?: boolean;
  style?: CSSProperties;
  className?: string;
  children: string;
}

export default function CopyBlock({ disabled, children: text, style, className }: CopyBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy: MouseEventHandler<HTMLDivElement> = () => {
    if (disabled) return;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <>
      <div className={`copy-block ${className || ''}`} onClick={handleCopy} style={style}>
        {text}
        <span className={`copy-notification ${copied ? 'visible' : ''}`}>コピーしました</span>
      </div>
      <style jsx>{`
        .copy-block {
          position: relative;
          overflow: visible;
          user-select: all;
          cursor: ${disabled ? 'default' : 'pointer'};
        }

        .copy-notification {
          font-size: 80%;
          background-color: #eee;
          color: #333;
          border: 1px solid #3339;
          border-radius: 4px;
          padding: 2px .5em;
          position: absolute;
          right: .5em;
          user-select: none;
          opacity: 0;
          visibility: hidden;
          transition: opacity .2s ease, visibility .2s;
        }

        .copy-notification.visible {
          opacity: 1;
          visibility: visible;
        }
      `}</style>
    </>
  );
}
