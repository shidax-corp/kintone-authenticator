import React from 'react';

export interface SearchFieldProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

/**
 * 検索用の入力フィールドを表示するコンポーネント。
 *
 * @param value - 入力フィールドの現在の値。
 * @param placeholder - 入力フィールドのプレースホルダーテキスト。省略すると "名前またはURLで検索" になる。
 * @param onChange - 入力値が変更されたときに呼び出されるコールバック関数。
 */
export default function SearchField({
  value,
  placeholder = '名前またはURLで検索',
  onChange,
}: SearchFieldProps) {
  return (
    <>
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <style jsx>{`
        input {
          width: 100%;
          box-sizing: border-box;
          padding: var(--ka-field-padding);
          font-size: var(--ka-font-size);
          background-color: var(--ka-bg-input-color);
          border: 1px solid var(--ka-bg-dark-color);
        }
      `}</style>
    </>
  );
}
