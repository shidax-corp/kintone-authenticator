import React from 'react';
import { type Root, createRoot } from 'react-dom/client';

let currentModalRoot: HTMLElement | null = null;
let currentReactRoot: Root | null = null;

/**
 * contentスクリプト内でReactコンポーネントをモーダルとして表示する
 */
export const renderModalComponent = (component: React.ReactElement): void => {
  // 既存のモーダルがあれば削除
  closeModal();

  // モーダル用の背景要素を作成
  const modalBackground = document.createElement('div');
  modalBackground.id = 'kintone-authenticator-modal-background';
  modalBackground.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // モーダルコンテンツ用の要素を作成
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    max-height: 90vh;
    overflow: hidden;
  `;

  // Reactアプリのルート要素を作成
  const reactRoot = document.createElement('div');
  reactRoot.id = 'kintone-authenticator-react-root';

  modalContent.appendChild(reactRoot);
  modalBackground.appendChild(modalContent);
  document.body.appendChild(modalBackground);

  // モーダル背景クリックで閉じる
  modalBackground.addEventListener('click', (e) => {
    if (e.target === modalBackground) {
      closeModal();
    }
  });

  // ESCキーで閉じる
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };
  document.addEventListener('keydown', handleKeyDown);

  // グローバル変数に保存
  currentModalRoot = modalBackground;

  // Reactコンポーネントをレンダリング
  const root = createRoot(reactRoot);
  currentReactRoot = root;
  root.render(component);

  // クリーンアップ処理を追加
  modalBackground.addEventListener('remove', () => {
    document.removeEventListener('keydown', handleKeyDown);
    if (currentReactRoot) {
      currentReactRoot.unmount();
      currentReactRoot = null;
    }
  });
};

/**
 * 現在表示中のモーダルを閉じる
 */
export const closeModal = (): void => {
  if (currentModalRoot && currentModalRoot.parentNode) {
    // removeイベントを発火させるためにdispatchEvent
    const removeEvent = new Event('remove');
    currentModalRoot.dispatchEvent(removeEvent);

    currentModalRoot.parentNode.removeChild(currentModalRoot);
    currentModalRoot = null;
  }

  if (currentReactRoot) {
    currentReactRoot.unmount();
    currentReactRoot = null;
  }
};
