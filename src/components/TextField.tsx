import React from 'react';

import Field from '@components/Field';
import CopyField from '@components/CopyField';

export interface TextFieldProps {
  label: string;
  value: string;
  onClick?: () => void;
}

/**
 * シンプルなテキストフィールドを表示するコンポーネント。
 *
 * @param label - フィールドの上に表示するラベル。
 * @param value - 表示するテキストの値。
 * @param onClick - テキストがクリックされたときのコールバック関数。デフォルトではテキストをコピーする。
 */
export default function TextField({ label, value, onClick }: TextFieldProps) {
  return (
    <Field label={label} onClick={onClick}>
      <CopyField value={onClick ? undefined : value}>{value}</CopyField>
    </Field>
  );
}
