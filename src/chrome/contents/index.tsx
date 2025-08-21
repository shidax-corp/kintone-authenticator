import React from 'react';

import { getFieldType, isInputField, normalizeURL } from '../lib/form-utils';
import { RegisterModal } from './RegisterModal';
import { SelectorModal } from './SelectorModal';
import { closeModal, renderModalComponent } from './modal-renderer';
import setupNotificationCenter from './notification';
import { getPageSiteName } from './page-info';

let currentInputElement: HTMLElement | null = null;
let autoFillExecuted = false;

const performAutoFill = async () => {
  if (autoFillExecuted) return;

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_SETTINGS',
    });

    if (!response.success || !response.data.autoFillEnabled) {
      return;
    }

    const currentUrl = normalizeURL(window.location.href);

    const recordsResponse = await chrome.runtime.sendMessage({
      type: 'GET_RECORDS',
      data: { url: currentUrl },
    });

    if (!recordsResponse.success || recordsResponse.data.length === 0) {
      return;
    }

    const record = recordsResponse.data[0];
    autoFillExecuted = true;

    const usernameFields = document.querySelectorAll(
      'input[type="text"], input[type="email"], input[name*="user"], input[name*="login"], input[id*="user"], input[id*="login"]'
    );
    const passwordFields = document.querySelectorAll('input[type="password"]');

    usernameFields.forEach((field) => {
      const inputField = field as HTMLInputElement;
      const fieldType = getFieldType(inputField);
      if (fieldType === 'username' || fieldType === 'email') {
        inputField.value = record.username;
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        inputField.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    passwordFields.forEach((field) => {
      const inputField = field as HTMLInputElement;
      inputField.value = record.password;
      inputField.dispatchEvent(new Event('input', { bubbles: true }));
      inputField.dispatchEvent(new Event('change', { bubbles: true }));
    });
  } catch {
    // Auto-fill failures are not critical, silently ignore
  }
};

const fillInputField = (element: HTMLElement, value: string) => {
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (element.isContentEditable) {
    element.textContent = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
};

// 通知システムを初期化
const { showToast } = setupNotificationCenter();

const showFillOptionsModal = async (
  records: kintone.types.SavedFields[],
  allRecords: kintone.types.SavedFields[],
  currentUrl: string
) => {
  try {
    // レコードデータをStoreに保存するか、直接propsとして渡す
    const handleFieldSelect = async (
      type: 'username' | 'password' | 'otp',
      value: string,
      recordId?: string
    ) => {
      if (type === 'otp' && recordId) {
        // OTPの場合は動的に生成
        try {
          const response = await chrome.runtime.sendMessage({
            type: 'GET_OTP',
            data: { recordId },
          });

          if (response.success && currentInputElement) {
            fillInputField(currentInputElement, response.data.otp);
            showToast('success', 'OTPを入力しました');
            closeModal();
          }
        } catch {
          showToast('error', 'OTPの取得に失敗しました');
        }
      } else if (currentInputElement) {
        fillInputField(currentInputElement, value);
        showToast(
          'success',
          `${type === 'username' ? 'ユーザー名' : 'パスワード'}を入力しました`
        );
        closeModal();
      }
    };

    const handleClose = () => {
      closeModal();
    };

    // 現在のURLを初期検索クエリとして使用
    const initialSearchQuery = currentUrl;

    // SelectorModalコンポーネントをレンダリング
    const selectorElement = React.createElement(SelectorModal, {
      onClose: handleClose,
      onFieldSelect: handleFieldSelect,
      initialRecords: records, // マッチしたレコードデータを渡す
      allRecords: allRecords, // すべてのレコードデータを渡す
      initialSearchQuery: initialSearchQuery, // 初期検索クエリを渡す
    });

    renderModalComponent(selectorElement);
  } catch {
    showToast('error', 'モーダルの表示に失敗しました');
  }
};

const showRegisterFormModal = async (otpAuthUri: string) => {
  try {
    const handleClose = () => {
      closeModal();
    };

    // content script環境で現在のページ情報を取得
    const currentPageTitle = getPageSiteName();
    const currentPageUrl = window.location.href;

    // RegisterModalコンポーネントをレンダリング
    const registerElement = React.createElement(RegisterModal, {
      onClose: handleClose,
      otpAuthUri: otpAuthUri,
      initialPageTitle: currentPageTitle,
      initialPageUrl: currentPageUrl,
      showToast: showToast,
    });

    renderModalComponent(registerElement);
  } catch {
    showToast('error', '登録フォームの表示に失敗しました');
  }
};

document.addEventListener('contextmenu', (e) => {
  const target = e.target as HTMLElement;

  if (isInputField(target)) {
    currentInputElement = target;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'SHOW_ERROR':
      showToast('error', message.data.message);
      break;

    case 'SHOW_FILL_OPTIONS':
      showFillOptionsModal(
        message.data.records,
        message.data.allRecords,
        message.data.currentUrl
      );
      break;

    case 'FILL_OTP':
      if (currentInputElement) {
        fillInputField(currentInputElement, message.data.otp);
        showToast('success', 'OTPを入力しました');
      }
      break;

    case 'OPEN_REGISTER_FORM':
      showRegisterFormModal(message.data.otpAuthUri);
      break;
  }

  sendResponse({ success: true });
});

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(performAutoFill, 1000);
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(performAutoFill, 1000);
  });
} else {
  setTimeout(performAutoFill, 1000);
}
