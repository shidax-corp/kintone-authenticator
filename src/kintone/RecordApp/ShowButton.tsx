import React from 'react';

export interface ShowButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function ShowButton({
  onClick,
  disabled = false,
}: ShowButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '6px 12px',
        border: '1px solid #e3e7e8',
        borderRadius: '4px',
        backgroundColor: disabled ? '#f5f5f5' : '#ffffff',
        color: disabled ? '#999999' : '#333333',
        fontSize: '12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        minWidth: '60px',
        height: '28px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      表示
    </button>
  );
}
