import React from 'react';
import { isInputField, getFieldType, normalizeURL } from './lib/url-matcher';
import { readQRFromElement } from '../lib/qr-reader';
import { renderModalComponent, closeModal } from './lib/content-react-helper';
import { SelectionView } from './popup/SelectionView';

let currentInputElement: HTMLElement | null = null;
let autoFillExecuted = false;

const generateInitialSearchQuery = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Remove 'www.' prefix if present
    const cleanHostname = hostname.replace(/^www\./, '');
    
    // Extract main domain name (remove subdomains if they exist)
    const parts = cleanHostname.split('.');
    if (parts.length >= 2) {
      // Take the second-to-last part as the main domain name
      return parts[parts.length - 2];
    }
    
    return cleanHostname;
  } catch (error) {
    console.error('Failed to parse URL for search query:', error);
    return '';
  }
};

const performAutoFill = async () => {
  if (autoFillExecuted) return;

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_SETTINGS'
    });

    if (!response.success || !response.data.autoFillEnabled) {
      return;
    }

    const settings = response.data;
    const currentUrl = normalizeURL(window.location.href);

    const recordsResponse = await chrome.runtime.sendMessage({
      type: 'GET_RECORDS',
      data: { url: currentUrl }
    });

    if (!recordsResponse.success || recordsResponse.data.length === 0) {
      return;
    }

    const record = recordsResponse.data[0];
    autoFillExecuted = true;

    const usernameFields = document.querySelectorAll('input[type="text"], input[type="email"], input[name*="user"], input[name*="login"], input[id*="user"], input[id*="login"]');
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

  } catch (error) {
    console.error('Auto-fill failed:', error);
  }
};

const fillInputField = (element: HTMLElement, value: string) => {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
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
  records: any[], 
  allRecords: any[], 
  currentUrl: string, 
  isGeneral: boolean, 
  title?: string
) => {
  try {
    // レコードデータをStoreに保存するか、直接propsとして渡す
    const handleFieldSelect = async (type: 'username' | 'password' | 'otp', value: string, recordId?: string) => {
      if (type === 'otp' && recordId) {
        // OTPの場合は動的に生成
        try {
          const response = await chrome.runtime.sendMessage({
            type: 'GET_OTP',
            data: { recordId }
          });
          
          if (response.success && currentInputElement) {
            fillInputField(currentInputElement, response.data.otp);
            showToast('OTPを入力しました');
            closeModal();
          }
        } catch (error) {
          showToast('OTPの取得に失敗しました', 'error');
        }
      } else if (currentInputElement) {
        fillInputField(currentInputElement, value);
        showToast(`${type === 'username' ? 'ユーザー名' : 'パスワード'}を入力しました`);
        closeModal();
      }
    };

    const handleClose = () => {
      closeModal();
    };

    // 現在のURLから初期検索クエリを生成
    const initialSearchQuery = generateInitialSearchQuery(currentUrl);

    // SelectionViewコンポーネントをレンダリング
    const selectionViewElement = React.createElement(SelectionView, {
      onRegister: () => {
        // 登録機能は contentスクリプトでは使用しないため空にする
      },
      isModal: true,
      onClose: handleClose,
      onFieldSelect: handleFieldSelect,
      initialRecords: records, // マッチしたレコードデータを渡す
      allRecords: allRecords, // すべてのレコードデータを渡す
      initialSearchQuery: initialSearchQuery // 初期検索クエリを渡す
    });

    renderModalComponent(selectionViewElement);
  } catch (error) {
    console.error('Failed to show selection modal:', error);
    showToast('モーダルの表示に失敗しました', 'error');
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
        message.data.currentUrl, 
        message.data.isGeneral, 
        message.data.title
      );
      break;

    case 'FILL_OTP':
      if (currentInputElement) {
        fillInputField(currentInputElement, message.data.otp);
        showToast('OTPを入力しました');
      }
      break;


    case 'OPEN_REGISTER_FORM':
      chrome.runtime.sendMessage({
        type: 'OPEN_POPUP',
        data: { action: 'register', otpAuthUri: message.data.otpAuthUri }
      });
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