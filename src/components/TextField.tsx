import CopyField from '@components/CopyField';
import Field from '@components/Field';

export interface TextFieldProps {
  label: string;
  value: string;
  onClick?: () => void;
  className?: string;
}

/**
 * シンプルなテキストフィールドを表示するコンポーネント。
 *
 * @param label - フィールドの上に表示するラベル。
 * @param value - 表示するテキストの値。
 * @param onClick - テキストがクリックされたときのコールバック関数。デフォルトではテキストをコピーする。
 * @param className - テキストを表示する枠に適用する追加のCSSクラス。
 */
export default function TextField({
  label,
  value,
  onClick,
  className,
}: TextFieldProps) {
  return (
    <Field label={label} onClick={onClick}>
      <CopyField value={onClick ? undefined : value} className={className}>
        {value}
      </CopyField>
    </Field>
  );
}
