import React from 'react';

import CopyBlock from './CopyBlock';

export interface CopyableFieldProps {
  width?: string;
  children: string;
}

export default function CopyableField({ width = '100%', children }: CopyableFieldProps) {
  return (
    <div style={{ boxSizing: 'border-box', width, padding: '4px 8px' }}><CopyBlock>{children}</CopyBlock></div>
  );
}
