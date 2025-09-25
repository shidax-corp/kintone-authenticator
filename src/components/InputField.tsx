import Field from '@components/Field';

export interface InputFieldProps {
  type: 'text' | 'url' | 'password' | 'search';
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

/**
 * テキスト入力フィールドを表示するコンポーネント。
 *
 * @param type - 入力フィールドのタイプ。
 * @param label - フィールドの上に表示するラベル。
 * @param placeholder - 入力フィールドのプレースホルダーテキスト。
 * @param value - 入力フィールドの現在の値。
 * @param onChange - 入力値が変更されたときに呼び出されるコールバック関数。
 * @param error - エラーメッセージを表示するための文字列。
 * @param required - 入力フィールドが必須かどうかを示すフラグ。デフォルトは false。
 */
export default function InputField({
  type,
  label,
  placeholder,
  value,
  onChange,
  error,
  required = false,
}: InputFieldProps) {
  const markedLabel = required ? (
    <>
      {label} <span className="required">(必須)</span>
      <style jsx>{`
        .required {
          color: var(--ka-fg-error-color);
          margin-left: 0.5em;
          font-size: 0.7em;
        }
      `}</style>
    </>
  ) : (
    label
  );

  return (
    <Field label={markedLabel}>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={error ? 'error' : ''}
        autoComplete="off"
      />
      {error && <div className="error">{error}</div>}
      <style jsx>{`
        input {
          width: 100%;
          box-sizing: border-box;
          background-color: var(--ka-bg-input-color);
          color: var(--ka-fg-color);
          border: 1px solid var(--ka-bg-tint-color);
          padding: 0.5em 1em;
          font-size: 1em;
        }
        input:invalid,
        input.error {
          border: 1px solid var(--ka-fg-error-color);
        }
        div.error {
          background-color: var(--ka-bg-error-color);
          color: var(--ka-fg-error-color);
          font-size: 0.8em;
        }
      `}</style>
    </Field>
  );
}
