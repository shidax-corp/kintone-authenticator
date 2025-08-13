import React, { useState, useEffect } from 'react';
import { decodeOTPAuthURI } from '../../lib/otpauth-uri';
import { isOTPAuthURI } from '../../lib/qr-reader';

interface RegisterFormProps {
  otpAuthUri?: string;
  onBack: () => void;
  onSuccess: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  otpAuthUri,
  onBack,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    username: '',
    password: '',
    otpAuthUri: otpAuthUri || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get current tab information to pre-fill form
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (currentTab && currentTab.url && currentTab.title) {
        setFormData((prev) => ({
          ...prev,
          name: prev.name || currentTab.title || '',
          url: prev.url || currentTab.url || '',
        }));
      }
    });

    // If OTPAuth URI is provided, extract information
    if (otpAuthUri && isOTPAuthURI(otpAuthUri)) {
      try {
        const parsed = decodeOTPAuthURI(otpAuthUri);
        setFormData((prev) => ({
          ...prev,
          name: prev.name || parsed.issuer || parsed.accountName || '',
          username: prev.username || parsed.accountName || '',
        }));
      } catch (error) {
        console.error('Failed to parse OTPAuth URI:', error);
        setError('OTPAuth URIの解析に失敗しました');
      }
    }
  }, [otpAuthUri]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('サイトの名前は必須です');
      }
      if (!formData.url.trim()) {
        throw new Error('URLは必須です');
      }
      if (!formData.username.trim()) {
        throw new Error('ユーザー名は必須です');
      }
      if (!formData.password.trim()) {
        throw new Error('パスワードは必須です');
      }

      // Validate OTPAuth URI if provided
      if (formData.otpAuthUri.trim() && !isOTPAuthURI(formData.otpAuthUri)) {
        throw new Error('有効なOTPAuth URIではありません');
      }

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
        onSuccess();
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

  const isFormValid =
    formData.name.trim() &&
    formData.url.trim() &&
    formData.username.trim() &&
    formData.password.trim();

  return (
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
          border-bottom: 1px solid #e0e0e0;
          background: #f8f9fa;
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
        }

        .back-button:hover {
          background: #e9ecef;
        }

        .header h1 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }

        .form-container {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
          color: #333;
          font-size: 14px;
        }

        .required {
          color: #e74c3c;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3498db;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 60px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 12px;
        }

        .help-text {
          font-size: 12px;
          color: #666;
          margin-top: 4px;
        }

        .error {
          background: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .footer {
          padding: 16px;
          border-top: 1px solid #e0e0e0;
          background: #f8f9fa;
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
          background: #3498db;
          color: white;
        }

        .button-primary:hover:not(:disabled) {
          background: #2980b9;
        }

        .otp-preview {
          background: #e3f2fd;
          border: 1px solid #2196f3;
          border-radius: 4px;
          padding: 12px;
          margin-top: 8px;
        }

        .otp-preview-title {
          font-weight: 500;
          color: #1976d2;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .otp-preview-info {
          font-size: 12px;
          color: #666;
          line-height: 1.4;
        }
      `}</style>

      <div className="header">
        <button className="back-button" onClick={onBack}>
          ←
        </button>
        <h1>新しいサイトを登録</h1>
      </div>

      <form onSubmit={handleSubmit} className="form-container">
        {error && <div className="error">{error}</div>}

        <div className="form-group">
          <label htmlFor="name">
            サイトの名前 <span className="required">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="例: Google"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="url">
            URL <span className="required">*</span>
          </label>
          <input
            id="url"
            type="url"
            value={formData.url}
            onChange={(e) => handleInputChange('url', e.target.value)}
            placeholder="例: https://accounts.google.com/*"
            required
          />
          <div className="help-text">ワイルドカード（*）を使用できます</div>
        </div>

        <div className="form-group">
          <label htmlFor="username">
            ユーザー名 <span className="required">*</span>
          </label>
          <input
            id="username"
            type="text"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            placeholder="ユーザー名またはメールアドレス"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">
            パスワード <span className="required">*</span>
          </label>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="パスワード"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="otpAuthUri">OTPAuth URI（任意）</label>
          <textarea
            id="otpAuthUri"
            value={formData.otpAuthUri}
            onChange={(e) => handleInputChange('otpAuthUri', e.target.value)}
            placeholder="otpauth://totp/..."
            rows={3}
          />
          <div className="help-text">
            QRコードから読み取ったOTPAuth URIを入力してください
          </div>
          {formData.otpAuthUri && isOTPAuthURI(formData.otpAuthUri) && (
            <div className="otp-preview">
              <div className="otp-preview-title">✓ 有効なOTPAuth URI</div>
              <div className="otp-preview-info">
                二段階認証のワンタイムパスワードが生成できます
              </div>
            </div>
          )}
        </div>
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
          onClick={handleSubmit}
          disabled={!isFormValid || loading}
        >
          {loading ? '登録中...' : '登録'}
        </button>
      </div>
    </div>
  );
};
