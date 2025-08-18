/**
 * @jest-environment jsdom
 */
import React from 'react';

import { closeModal, renderModalComponent } from './content-react-helper';

describe('content-react-helper', () => {
  beforeEach(() => {
    // DOMをクリア
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // 各テスト後にモーダルをクリーンアップ
    closeModal();
  });

  describe('renderModalComponent', () => {
    it('should create modal with white background to ensure visibility on dark sites', () => {
      const testComponent = React.createElement('div', {}, 'Test Content');

      renderModalComponent(testComponent);

      // モーダル背景要素が作成されていることを確認
      const modalBackground = document.getElementById(
        'kintone-authenticator-modal-background'
      );
      expect(modalBackground).toBeTruthy();

      // モーダルコンテンツ要素が作成されていることを確認
      const modalContent = modalBackground?.firstElementChild as HTMLElement;
      expect(modalContent).toBeTruthy();

      // 白い背景が設定されていることを確認（ダークテーマサイトでの可視性のため）
      expect(modalContent.style.background).toBe('white');
      expect(modalContent.style.borderRadius).toBe('8px');
      expect(modalContent.style.boxShadow).toBe(
        '0 4px 20px rgba(0, 0, 0, 0.3)'
      );

      // ReactルートがDOMに追加されていることを確認
      const reactRoot = document.getElementById(
        'kintone-authenticator-react-root'
      );
      expect(reactRoot).toBeTruthy();
      expect(modalContent.contains(reactRoot)).toBe(true);
    });

    it('should close modal when closeModal is called', () => {
      const testComponent = React.createElement('div', {}, 'Test Content');

      renderModalComponent(testComponent);

      // モーダルが存在することを確認
      expect(
        document.getElementById('kintone-authenticator-modal-background')
      ).toBeTruthy();

      closeModal();

      // モーダルが削除されていることを確認
      expect(
        document.getElementById('kintone-authenticator-modal-background')
      ).toBeFalsy();
    });
  });
});
