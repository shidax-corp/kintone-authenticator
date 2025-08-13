import React, { useState, useEffect } from 'react';
import { isOTPAuthURI } from '@lib/qr-reader';

import InputField from './InputField';
import PasswordField from './PasswordField';
import TextAreaField from './TextAreaField';

export interface FormAppProps {
  appId: number;
  recordId?: number;
  record?: kintone.types.SavedFields;
  mode: 'create' | 'edit';
}

interface FormData {
  name: string;
  url: string;
  username: string;
  password: string;
  otpuri: string;
}

interface FormErrors {
  name?: string;
  url?: string;
  username?: string;
  password?: string;
  otpuri?: string;
}

export default function FormApp({ record, mode }: FormAppProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    url: '',
    username: '',
    password: '',
    otpuri: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (mode === 'edit' && record) {
      setFormData({
        name: record.name.value || '',
        url: record.url.value || '',
        username: record.username.value || '',
        password: record.password.value || '',
        otpuri: record.otpuri.value || ''
      });
    }
  }, [mode, record]);

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) return false;
    
    try {
      new URL(url.replace(/\*/g, 'example'));
      return true;
    } catch {
      return /^https?:\/\/[^\s/$.?#].[^\s]*$/.test(url);
    }
  };

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'サイト名は必須です';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'URLは必須です';
    } else if (!validateUrl(formData.url)) {
      newErrors.url = '有効なURLを入力してください';
    }

    if (formData.otpuri && !isOTPAuthURI(formData.otpuri)) {
      newErrors.otpuri = '有効なOTPAuth URIを入力してください';
    }

    return newErrors;
  };

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  useEffect(() => {
    (window as any).__kintonFormData = formData;
    (window as any).__kintonFormValidate = validateForm;
  }, [formData]);

  useEffect(() => {
    kintone.app.record.setFieldShown('name', false);
    kintone.app.record.setFieldShown('url', false);
    kintone.app.record.setFieldShown('username', false);
    kintone.app.record.setFieldShown('password', false);
    kintone.app.record.setFieldShown('otpuri', false);
  }, []);

  return (
    <>
      <div className="form-app">
        <div className="form-header">
          <h2 className="form-title">
            {mode === 'create' ? '新しい認証情報を登録' : '認証情報を編集'}
          </h2>
        </div>

        <div className="form-content">
          <InputField
            label="サイト名"
            value={formData.name}
            onChange={(value) => handleFieldChange('name', value)}
            placeholder="例: Google"
            required
            error={errors.name}
          />

          <InputField
            label="URL"
            value={formData.url}
            onChange={(value) => handleFieldChange('url', value)}
            placeholder="例: https://accounts.google.com/*"
            type="url"
            required
            error={errors.url}
            helpText="ワイルドカード（*）を使用できます"
          />

          <InputField
            label="ユーザー名"
            value={formData.username}
            onChange={(value) => handleFieldChange('username', value)}
            placeholder="ユーザー名またはメールアドレス"
            error={errors.username}
            helpText="任意入力"
          />

          <PasswordField
            label="パスワード"
            value={formData.password}
            onChange={(value) => handleFieldChange('password', value)}
            placeholder="パスワード"
            error={errors.password}
            helpText="任意入力"
          />

          <TextAreaField
            label="OTPAuth URI"
            value={formData.otpuri}
            onChange={(value) => handleFieldChange('otpuri', value)}
            placeholder="otpauth://totp/..."
            error={errors.otpuri}
            helpText="QRコードから読み取ったOTPAuth URIを入力してください（任意入力）"
            rows={3}
          />

          {formData.otpuri && isOTPAuthURI(formData.otpuri) && (
            <div className="otp-preview">
              <div className="otp-preview-icon">✓</div>
              <div className="otp-preview-text">
                有効なOTPAuth URIです。二段階認証のワンタイムパスワードが生成できます。
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .form-app {
          max-width: 800px;
          margin: 0 auto;
          padding: 16px;
        }

        .form-header {
          margin-bottom: 24px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e3e7e8;
        }

        .form-title {
          margin: 0;
          font-size: 18px;
          font-weight: 500;
          color: #333333;
        }

        .form-content {
          max-width: 100%;
        }

        .otp-preview {
          background: #e8f5e8;
          border: 1px solid #4caf50;
          border-radius: 4px;
          padding: 12px;
          margin-top: 8px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .otp-preview-icon {
          color: #4caf50;
          font-weight: bold;
          flex-shrink: 0;
        }

        .otp-preview-text {
          font-size: 12px;
          color: #2e7d32;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .form-app {
            padding: 12px;
          }

          .form-title {
            font-size: 16px;
          }
        }
      `}</style>
    </>
  );
}