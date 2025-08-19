import React from 'react';
import { type Root, createRoot } from 'react-dom/client';

let currentModalRoot: HTMLElement | null = null;
let currentReactRoot: Root | null = null;

/**
 * contentスクリプト内でReactコンポーネントをモーダルとして表示する
 * DOM操作とReact root管理に特化し、モーダルの動作はModalBaseコンポーネントに委譲
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
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // Reactアプリのルート要素を作成
  const reactRoot = document.createElement('div');
  reactRoot.id = 'kintone-authenticator-react-root';

  modalBackground.appendChild(reactRoot);
  document.body.appendChild(modalBackground);

  // グローバル変数に保存
  currentModalRoot = modalBackground;

  // Reactコンポーネントをレンダリング
  const root = createRoot(reactRoot);
  currentReactRoot = root;
  root.render(component);
};

/**
 * 現在表示中のモーダルを閉じる
 */
export const closeModal = (): void => {
  if (currentModalRoot && currentModalRoot.parentNode) {
    currentModalRoot.parentNode.removeChild(currentModalRoot);
    currentModalRoot = null;
  }

  if (currentReactRoot) {
    currentReactRoot.unmount();
    currentReactRoot = null;
  }
};