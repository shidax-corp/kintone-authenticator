import React, { CSSProperties, useState } from 'react';
import type { MouseEventHandler } from 'react';

export interface CopyBlockProps {
  disabled?: boolean;
  style?: CSSProperties;
  children: string;
}

export default function CopyBlock({ disabled, children: text, style }: CopyBlockProps) {
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
      <div onClick={handleCopy} style={{ position: 'relative', overflow: 'visible', userSelect: 'all', ...style }}>
        {text}
        <span style={{
          fontSize: '80%',
          backgroundColor: '#eee',
          color: '#333',
          border: '1px solid #3339',
          borderRadius: '4px',
          padding: '2px .5em',
          position: 'absolute',
          right: '.5em',
          userSelect: 'none',
          opacity: copied ? 1 : 0,
          visibility: copied ? 'visible' : 'hidden',
          transition: 'opacity .2s ease, visibility .2s'
        }}>コピーしました</span>
      </div>
    </>
  );
}
