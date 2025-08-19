import React from 'react';

import { AuthenticatorModalApp } from './AuthenticatorModalApp';
import { AuthenticatorWrapper } from './AuthenticatorWrapper';
import { closeModal, renderModalComponent } from './lib/content-react-helper';
import { getFieldType, isInputField, normalizeURL } from './lib/url-matcher';

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

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  const existingToast = document.getElementById('kintone-auth-toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.id = 'kintone-auth-toast';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#4caf50' : '#f44336'};
    color: white;
    padding: 12px 24px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    max-width: 300px;
    word-wrap: break-word;
  `;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 3000);
};

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
            showToast('OTPを入力しました');
            closeModal();
          }
        } catch {
          showToast('OTPの取得に失敗しました', 'error');
        }
      } else if (currentInputElement) {
        fillInputField(currentInputElement, value);
        showToast(
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

    // AuthenticatorWrapperコンポーネントをレンダリング
    const authenticatorElement = React.createElement(AuthenticatorWrapper, {
      onRegister: () => {
        // 登録機能は contentスクリプトでは使用しないため空にする
      },
      isModal: true,
      onClose: handleClose,
      onFieldSelect: handleFieldSelect,
      initialRecords: records, // マッチしたレコードデータを渡す
      allRecords: allRecords, // すべてのレコードデータを渡す
      initialSearchQuery: initialSearchQuery, // 初期検索クエリを渡す
    });

    renderModalComponent(authenticatorElement);
  } catch {
    showToast('モーダルの表示に失敗しました', 'error');
  }
};

const showRegisterFormModal = async (otpAuthUri: string) => {
  try {
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
            showToast('OTPを入力しました');
            closeModal();
          }
        } catch {
          showToast('OTPの取得に失敗しました', 'error');
        }
      } else if (currentInputElement) {
        fillInputField(currentInputElement, value);
        showToast(
          `${type === 'username' ? 'ユーザー名' : 'パスワード'}を入力しました`
        );
        closeModal();
      }
    };

    const handleClose = () => {
      closeModal();
    };

    // content script環境で現在のページ情報を取得
    const currentPageTitle = document.title;
    const currentPageUrl = window.location.href;

    // AuthenticatorModalAppコンポーネントを登録フォーム表示モードでレンダリング
    const modalAppElement = React.createElement(AuthenticatorModalApp, {
      onClose: handleClose,
      onFieldSelect: handleFieldSelect,
      initialViewMode: 'register',
      initialOtpAuthUri: otpAuthUri,
      initialPageTitle: currentPageTitle,
      initialPageUrl: currentPageUrl,
    });

    renderModalComponent(modalAppElement);
  } catch {
    showToast('登録フォームの表示に失敗しました', 'error');
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
      showToast(message.data.message, 'error');
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
        showToast('OTPを入力しました');
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
