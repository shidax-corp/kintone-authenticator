import React, { useState } from 'react';

import CopyField from '@components/CopyField';
import Field from '@components/Field';

export interface PasswordFieldProps {
  value: string;
  onClick?: () => void;
}

/**
 * パスワードを表示するフィールドコンポーネント。
 *
 * @param value - 表示するパスワードの値。
 * @param onClick - パスワードがクリックされたときのコールバック関数。デフォルトではパスワードをコピーする。
 */
export default function PasswordField({ value, onClick }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <Field label="パスワード" onClick={onClick}>
        <CopyField value={onClick ? undefined : value}>
          {visible ? value : '●●●●●●●●'}
        </CopyField>
      </Field>
    </div>
  );
}
