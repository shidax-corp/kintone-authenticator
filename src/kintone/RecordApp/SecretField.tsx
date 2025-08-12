import React, { useState } from 'react';

import CopyBlock from './CopyBlock';

export interface SectetFieldProps {
  value: string;
}

export default function SecretField({ value }: SectetFieldProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div style={{ padding: '4px 8px' }} onMouseEnter={() => setIsRevealed(true)} onMouseLeave={() => setIsRevealed(false)}>
      <CopyBlock disabled={!isRevealed}>
        {isRevealed ? (
          value
        ) : (
          "█████"
        )}
      </CopyBlock>
    </div>
  );
}

