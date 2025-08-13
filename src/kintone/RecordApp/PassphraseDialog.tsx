import React, { useState, useEffect } from 'react';

export interface PassphraseDialogProps {
  isOpen: boolean;
  onConfirm: (passphrase: string) => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}

export default function PassphraseDialog({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  title = 'パスフレーズの入力',
  message = 'パスワードと OTP を表示するためのパスフレーズを入力してください。'
}: PassphraseDialogProps) {
  const [passphrase, setPassphrase] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPassphrase('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passphrase.trim()) {
      onConfirm(passphrase);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onCancel}
    >
      <div 
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          padding: '24px',
          minWidth: '400px',
          maxWidth: '500px',
          width: '90%',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h3 style={{
          margin: '0 0 16px 0',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#333333',
          borderBottom: '1px solid #e3e7e8',
          paddingBottom: '8px',
        }}>
          {title}
        </h3>
        
        <p style={{
          margin: '0 0 16px 0',
          fontSize: '14px',
          color: '#666666',
          lineHeight: '1.5',
        }}>
          {message}
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="パスフレーズを入力"
            autoFocus
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e3e7e8',
              borderRadius: '4px',
              fontSize: '14px',
              marginBottom: '20px',
              boxSizing: 'border-box',
            }}
          />
          
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
          }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '8px 16px',
                border: '1px solid #e3e7e8',
                borderRadius: '4px',
                backgroundColor: '#ffffff',
                color: '#666666',
                fontSize: '14px',
                cursor: 'pointer',
                minWidth: '80px',
              }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!passphrase.trim()}
              style={{
                padding: '8px 16px',
                border: '1px solid #3498db',
                borderRadius: '4px',
                backgroundColor: passphrase.trim() ? '#3498db' : '#e3e7e8',
                color: passphrase.trim() ? '#ffffff' : '#999999',
                fontSize: '14px',
                cursor: passphrase.trim() ? 'pointer' : 'not-allowed',
                minWidth: '80px',
              }}
            >
              OK
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}