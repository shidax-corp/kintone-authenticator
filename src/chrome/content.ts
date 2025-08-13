import { isInputField, getFieldType, normalizeURL } from './lib/url-matcher';
import { readQRFromElement } from '../lib/qr-reader';

let currentInputElement: HTMLElement | null = null;
let autoFillExecuted = false;

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

const showFillOptionsModal = (records: any[], isGeneral: boolean, title?: string) => {
  const existingModal = document.getElementById('kintone-auth-modal');
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'kintone-auth-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    border-radius: 8px;
    padding: 24px;
    max-width: 400px;
    max-height: 600px;
    overflow-y: auto;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;

  const titleElement = document.createElement('h3');
  titleElement.textContent = title || (isGeneral ? 'レコードを選択' : '一致するレコード');
  titleElement.style.cssText = 'margin: 0 0 16px 0; font-size: 18px; color: #333;';

  const list = document.createElement('ul');
  list.style.cssText = 'list-style: none; padding: 0; margin: 0;';

  records.forEach(record => {
    const listItem = document.createElement('li');
    listItem.style.cssText = 'margin: 8px 0;';

    const recordButton = document.createElement('button');
    recordButton.textContent = record.name;
    recordButton.style.cssText = `
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #f9f9f9;
      cursor: pointer;
      text-align: left;
    `;

    recordButton.addEventListener('click', () => {
      showFieldOptionsModal(record);
    });

    listItem.appendChild(recordButton);
    list.appendChild(listItem);
  });

  const closeButton = document.createElement('button');
  closeButton.textContent = 'キャンセル';
  closeButton.style.cssText = `
    margin-top: 16px;
    padding: 8px 16px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
    cursor: pointer;
  `;

  closeButton.addEventListener('click', () => {
    modal.remove();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  content.appendChild(titleElement);
  content.appendChild(list);
  content.appendChild(closeButton);
  modal.appendChild(content);
  document.body.appendChild(modal);
};

const showFieldOptionsModal = (record: any) => {
  const existingModal = document.getElementById('kintone-auth-modal');
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'kintone-auth-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    border-radius: 8px;
    padding: 24px;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;

  const title = document.createElement('h3');
  title.textContent = record.name;
  title.style.cssText = 'margin: 0 0 16px 0; font-size: 18px; color: #333;';

  const fields = [
    { label: 'ユーザー名', value: record.username, type: 'username' },
    { label: 'パスワード', value: record.password, type: 'password' },
  ];

  if (record.otpAuthUri) {
    fields.push({ label: 'ワンタイムパスワード', value: '', type: 'otp' });
  }

  const fieldList = document.createElement('div');

  fields.forEach(field => {
    const button = document.createElement('button');
    button.textContent = field.label;
    button.style.cssText = `
      width: 100%;
      margin: 8px 0;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #f9f9f9;
      cursor: pointer;
      text-align: left;
    `;

    button.addEventListener('click', async () => {
      if (field.type === 'otp') {
        try {
          const response = await chrome.runtime.sendMessage({
            type: 'GET_OTP',
            data: { recordId: record.recordId }
          });

          if (response.success && currentInputElement) {
            fillInputField(currentInputElement, response.data.otp);
            showToast('OTPを入力しました');
            modal.remove();
          }
        } catch (error) {
          showToast('OTPの取得に失敗しました', 'error');
        }
      } else if (currentInputElement) {
        fillInputField(currentInputElement, field.value);
        showToast(`${field.label}を入力しました`);
        modal.remove();
      }
    });

    fieldList.appendChild(button);
  });

  const closeButton = document.createElement('button');
  closeButton.textContent = 'キャンセル';
  closeButton.style.cssText = `
    margin-top: 16px;
    padding: 8px 16px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
    cursor: pointer;
  `;

  closeButton.addEventListener('click', () => {
    modal.remove();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  content.appendChild(title);
  content.appendChild(fieldList);
  content.appendChild(closeButton);
  modal.appendChild(content);
  document.body.appendChild(modal);
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
      showFillOptionsModal(message.data.records, message.data.isGeneral, message.data.title);
      break;

    case 'FILL_OTP':
      if (currentInputElement) {
        fillInputField(currentInputElement, message.data.otp);
        showToast('OTPを入力しました');
      }
      break;

    case 'SHOW_OTP_OPTIONS':
      showFillOptionsModal(message.data.records, false);
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