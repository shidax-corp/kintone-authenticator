import React from 'react';

import { extractOriginURL } from '@lib/url';

import { RegisterFormLogic, type RegisterFormData } from '../lib/RegisterFormLogic';
import { getActiveTabSiteName } from './tab-utils';

interface RegisterFormProps {
  otpAuthUri?: string;
  onBack: () => void;
  onSuccess: (recordId?: string) => void;
  initialPageTitle?: string;
  initialPageUrl?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  otpAuthUri,
  onBack,
  onSuccess,
  initialPageTitle,
  initialPageUrl,
}) => {
  // Chrome tabs APIから現在のタブ情報を取得する関数
  const getTabInfo = async (): Promise<{ name: string; url: string }> => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      try {
        // Use getActiveTabSiteName to get og:site_name if available, fallback to title
        const siteName = await getActiveTabSiteName();

        // Get current tab for URL using Promise-based approach
        return new Promise((resolve) => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            if (currentTab) {
              resolve({
                name: siteName || currentTab.title || '',
                url: extractOriginURL(currentTab.url) || '',
              });
            } else {
              resolve({ name: '', url: '' });
            }
          });
        });
      } catch {
        // If getActiveTabSiteName fails, fallback to original method
        return new Promise((resolve) => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            if (currentTab && currentTab.url && currentTab.title) {
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
      onSuccess(response.data?.recordId);
    } else {
      throw new Error(response.error || '登録に失敗しました');
    }
  };

  return (
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
        <div className="register-form">
          <style jsx>{`
            .register-form {
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
              display: flex;
              align-items: center;
              gap: 12px;
            }

            .back-button {
              padding: 8px;
              border: none;
              background: none;
              cursor: pointer;
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: var(--ka-fg-color);
            }

            .back-button:hover {
              background: var(--ka-bg-dark-color);
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
            <button className="back-button" onClick={onBack}>
              ←
            </button>
            <h1>新しいサイトを登録</h1>
          </div>

          <form onSubmit={onFormSubmit} className="form-container">
            {error && <div className="error">{error}</div>}
            {formFields}
          </form>

          <div className="footer">
            <button
              type="button"
              className="button button-secondary"
              onClick={onBack}
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
  );
};
