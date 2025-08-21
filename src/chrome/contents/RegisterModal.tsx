import React from 'react';

import { extractOriginURL } from '@lib/url';

import { RegisterFormLogic, type RegisterFormData } from '../lib/RegisterFormLogic';
import ModalBase from './ModalBase';
import type { NotificationType } from './notification';

interface RegisterModalProps {
  onClose: () => void;
  otpAuthUri?: string;
  initialPageTitle?: string;
  initialPageUrl?: string;
  showToast: (type: NotificationType, message: string) => void;
}

/**
 * OTP登録機能専用モーダル
 * 新しいサイトのOTP情報を登録する
 */
export const RegisterModal: React.FC<RegisterModalProps> = ({
  onClose,
  otpAuthUri,
  initialPageTitle,
  initialPageUrl,
  showToast,
}) => {
  // Chrome tabs APIから現在のタブ情報を取得する関数
  const getTabInfo = async (): Promise<{ name: string; url: string }> => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const currentTab = tabs[0];
          if (currentTab?.url && currentTab.title) {
            resolve({
              name: currentTab.title || '',
              url: extractOriginURL(currentTab.url) || '',
            });
          } else {
            resolve({ name: '', url: '' });
          }
        });
      });
    }
    return { name: '', url: '' };
  };

  // フォーム送信処理
  const handleSubmit = async (data: RegisterFormData) => {
    const response = await chrome.runtime.sendMessage({
      type: 'REGISTER_OTP',
      data: {
        name: data.name.trim(),
        url: data.url.trim(),
        username: data.username.trim(),
        password: data.password.trim(),
        otpAuthUri: data.otpAuthUri.trim() || undefined,
      },
    });

    if (response.success) {
      // 登録成功後、最新のOTPを生成してコピー
      const recordId = response.data?.recordId;
      if (recordId) {
        try {
          const otpResponse = await chrome.runtime.sendMessage({
            type: 'GET_OTP',
            data: { recordId },
          });

          if (otpResponse.success && otpResponse.data?.otp) {
            // OTPをクリップボードにコピー
            await navigator.clipboard.writeText(otpResponse.data.otp);

            // Toast表示
            showToast(
              'success',
              `OTPが登録され、クリップボードにコピーされました: ${otpResponse.data.otp}`
            );
          }
        } catch (error) {
          console.error('OTP生成エラー:', error);
        }
      }

      // モーダルを閉じる
      onClose();
    } else {
      throw new Error(response.error || '登録に失敗しました');
    }
  };

  return (
    <ModalBase onClose={onClose}>
      <RegisterFormLogic
        otpAuthUri={otpAuthUri}
        initialPageTitle={initialPageTitle}
        initialPageUrl={initialPageUrl}
        onSubmit={handleSubmit}
        getTabInfo={getTabInfo}
      >
        {({
          error,
          formFields,
          handleSubmit: onFormSubmit,
          loading,
          isFormValid,
        }) => (
          <div className="register-modal">
            <style jsx>{`
              .register-modal {
                width: 400px;
                max-height: 600px;
                font-family:
                  -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                flex-direction: column;
              }

              .header {
                padding: 16px;
                border-bottom: 1px solid var(--ka-bg-dark-color);
                background: var(--ka-bg-tint-color);
              }

              .header h1 {
                margin: 0;
                font-size: 18px;
                color: var(--ka-fg-color);
              }

              .form-container {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
              }

              .form-group {
                margin-bottom: 16px;
              }

              .help-text {
                font-size: 12px;
                color: var(--ka-fg-light-color);
                margin-top: 4px;
              }

              .error {
                background: var(--ka-bg-error-color);
                color: var(--ka-fg-error-color);
                padding: 12px;
                border-radius: 4px;
                margin-bottom: 16px;
                font-size: 14px;
              }

              .field-error {
                background-color: var(--ka-bg-error-color);
                color: var(--ka-fg-error-color);
                font-size: 0.8em;
                padding: 4px 8px;
                margin-top: 4px;
                border-radius: 4px;
              }

              .footer {
                padding: 16px;
                border-top: 1px solid var(--ka-bg-dark-color);
                background: var(--ka-bg-tint-color);
                display: flex;
                gap: 12px;
              }

              .button {
                flex: 1;
                padding: 12px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
                font-size: 14px;
              }

              .button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
              }

              .button-secondary {
                background: #6c757d;
                color: white;
              }

              .button-secondary:hover:not(:disabled) {
                background: #5a6268;
              }

              .button-primary {
                background: var(--ka-primary-color);
                color: white;
              }

              .button-primary:hover:not(:disabled) {
                background: #2980b9;
              }
            `}</style>

            <div className="header">
              <h1>ワンタイムパスワードを登録</h1>
            </div>

            <form onSubmit={onFormSubmit} className="form-container">
              {error && <div className="error">{error}</div>}
              {formFields}
            </form>

            <div className="footer">
              <button
                type="button"
                className="button button-secondary"
                onClick={onClose}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="button button-primary"
                onClick={onFormSubmit}
                disabled={!isFormValid || loading}
              >
                {loading ? '登録中...' : '登録'}
              </button>
            </div>
          </div>
        )}
      </RegisterFormLogic>
    </ModalBase>
  );
};

export default RegisterModal;
