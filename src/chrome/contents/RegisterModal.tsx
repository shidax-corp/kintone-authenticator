import { type FormEvent, useCallback, useEffect, useState } from 'react';

import {
  type OTPAuthRecord,
  decodeOTPAuthURI,
  isValidOTPAuthURI,
} from '@lib/otpauth-uri';
import { extractOriginURL } from '@lib/url';

import InputField from '@components/InputField';
import OTPInputField from '@components/OTPInputField';

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
export const RegisterModal = ({
  onClose,
  otpAuthUri,
  initialPageTitle,
  initialPageUrl,
  showToast,
}: RegisterModalProps) => {
  const [formData, setFormData] = useState({
    name: initialPageTitle || '',
    url: initialPageUrl || '',
    username: '',
    password: '',
    otpAuthUri: otpAuthUri || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Get current tab information to pre-fill form (only in extension context)
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        if (currentTab?.url && currentTab.title) {
          setFormData((prev) => ({
            ...prev,
            name: prev.name || currentTab.title || '',
            url: prev.url || extractOriginURL(currentTab.url) || '',
          }));
        }
      });
    }

    // If OTPAuth URI is provided, extract information
    if (!otpAuthUri) return;
    isValidOTPAuthURI(otpAuthUri).then((isValid) => {
      if (isValid) {
        try {
          const parsed = decodeOTPAuthURI(otpAuthUri);
          setFormData((prev) => ({
            ...prev,
            name: prev.name || parsed.issuer || parsed.accountName || '',
            username: prev.username || parsed.accountName || '',
          }));
        } catch {
          setError('OTPAuth URIの解析に失敗しました');
        }
      }
    });
  }, [otpAuthUri, initialPageTitle, initialPageUrl]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleOTPChange = useCallback(
    (value: string, info: OTPAuthRecord | null) => {
      setFormData((prev) => ({
        ...prev,
        otpAuthUri: value,
      }));
      setError(null);
      setFieldErrors((prev) => ({ ...prev, otpAuthUri: '' }));

      // If valid OTP info is provided, update related fields
      if (info) {
        setFormData((prev) => ({
          ...prev,
          name: prev.name || info.issuer || info.accountName || '',
          username: prev.username || info.accountName || '',
        }));
      }
    },
    []
  );

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'サイトの名前は必須です';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'REGISTER_OTP',
        data: {
          name: formData.name.trim(),
          url: formData.url.trim(),
          username: formData.username.trim(),
          password: formData.password.trim(),
          otpAuthUri: formData.otpAuthUri.trim() || undefined,
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
              try {
                // OTPをクリップボードにコピー
                await navigator.clipboard.writeText(otpResponse.data.otp);

                // Toast表示（コピー成功時のみ）
                showToast(
                  'success',
                  `OTPが登録され、クリップボードにコピーされました: ${otpResponse.data.otp}`
                );
              } catch (clipboardError) {
                // クリップボードへのコピーに失敗した場合
                console.error('クリップボードコピーエラー:', clipboardError);
                showToast(
                  'success',
                  `OTPが登録されました: ${otpResponse.data.otp}`
                );
              }
            }
          } catch (error) {
            console.error('OTP生成エラー:', error);
          }
        }

        // モーダルを閉じる
        onClose();
      } else {
        setError(response.error || '登録に失敗しました');
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '登録中にエラーが発生しました'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBase onClose={onClose}>
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

        <form onSubmit={handleSubmit} className="form-container">
          {error && <div className="error">{error}</div>}

          <div className="form-group">
            <InputField
              type="text"
              label="サイトの名前"
              placeholder="例: Google"
              value={formData.name}
              onChange={(value) => handleInputChange('name', value)}
              error={fieldErrors.name}
              required
            />
          </div>

          <div className="form-group">
            <InputField
              type="url"
              label="URL"
              placeholder="例: https://accounts.google.com/*"
              value={formData.url}
              onChange={(value) => handleInputChange('url', value)}
              error={fieldErrors.url}
            />
            <div className="help-text">ワイルドカード（*）を使用できます</div>
          </div>

          <div className="form-group">
            <InputField
              type="text"
              label="ユーザー名"
              placeholder="ユーザー名またはメールアドレス"
              value={formData.username}
              onChange={(value) => handleInputChange('username', value)}
              error={fieldErrors.username}
            />
          </div>

          <div className="form-group">
            <InputField
              type="password"
              label="パスワード"
              placeholder="パスワード"
              value={formData.password}
              onChange={(value) => handleInputChange('password', value)}
              error={fieldErrors.password}
            />
          </div>

          <div className="form-group">
            <OTPInputField
              label="ワンタイムパスワード"
              value={formData.otpAuthUri}
              onChange={handleOTPChange}
              disableCamera={true}
            />
          </div>
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
            onClick={handleSubmit}
            disabled={formData.name.trim() === '' || loading}
          >
            {loading ? '登録中...' : '登録'}
          </button>
        </div>
      </div>
    </ModalBase>
  );
};

export default RegisterModal;
