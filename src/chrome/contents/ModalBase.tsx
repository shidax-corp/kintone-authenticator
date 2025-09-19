import { type MouseEvent, type ReactNode, useEffect } from 'react';

import GlobalStyle from '@components/GlobalStyle';

interface ModalBaseProps {
  onClose?: () => void;
  children: ReactNode;
}

/**
 * モーダルの基本コンポーネント
 * 背景を暗くし、コンテンツを中央に配置する
 */
const ModalBase = ({ onClose = () => {}, children }: ModalBaseProps) => {
  // ESCキーでモーダルを閉じる
  useEffect(() => {
    if (!onClose) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // 背景クリックでモーダルを閉じる
  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <GlobalStyle>
      <div className="modal-overlay" onClick={handleOverlayClick}>
        <div className="modal-content">
          {onClose && (
            <button
              className="modal-close-button"
              onClick={onClose}
              title="閉じる"
            >
              ✕
            </button>
          )}
          {children}
        </div>
        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
            box-sizing: border-box;
          }

          .modal-content {
            background: var(--ka-bg-color);
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            max-width: 90vw;
            max-height: 90vh;
            overflow: hidden;
            position: relative;
          }

          .modal-close-button {
            position: absolute;
            top: 12px;
            right: 12px;
            background: none;
            border: none;
            font-size: 20px;
            color: var(--ka-fg-light-color);
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            z-index: 10;
          }

          .modal-close-button:hover {
            background: var(--ka-bg-dark-color);
            color: var(--ka-fg-color);
          }
        `}</style>
      </div>
    </GlobalStyle>
  );
};

export default ModalBase;
