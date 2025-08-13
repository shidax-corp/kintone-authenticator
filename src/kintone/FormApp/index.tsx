import React, { useState, useEffect } from 'react';
import { isOTPAuthURI } from '@lib/qr-reader';

import InputField from './InputField';
import PasswordField from './PasswordField';
import OTPAuthURIField from './OTPAuthURIField';
import { FormData, FormErrors, validateFormData } from '../lib/validation';

export interface FormAppProps {
  appId: number;
  recordId?: number;
  record?: kintone.types.SavedFields;
  mode: 'create' | 'edit';
}

export default function FormApp({ record, mode }: FormAppProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    url: '',
    username: '',
    password: '',
    otpuri: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [parsedOTPData, setParsedOTPData] = useState<any>(null);

  const handleOTPDataChange = (parsedData: any) => {
    setParsedOTPData(parsedData);

    // Auto-populate form fields from parsed URI when available
    if (parsedData && parsedData.issuer && !formData.name.trim()) {
      handleFieldChange('name', parsedData.issuer);
    }
  };

  useEffect(() => {
    if (mode === 'edit' && record) {
      setFormData({
        name: record.name.value || '',
        url: record.url.value || '',
        username: record.username.value || '',
        password: record.password.value || '',
        otpuri: record.otpuri.value || '',
      });
    }
  }, [mode, record]);

  const handleFieldChange = async (field: keyof FormData, value: string) => {
    const newFormData = {
      ...formData,
      [field]: value,
    };

    setFormData(newFormData);

    try {
      // Get current record and update the specific field
      const currentRecord = kintone.app.record.get();
      const updatedRecord = {
        ...currentRecord.record,
        [field]: {
          type: 'SINGLE_LINE_TEXT',
          value: value,
        },
      };
      await kintone.app.record.set({ record: updatedRecord });
    } catch (error) {
      console.error('Failed to update kintone record:', error);
    }

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  useEffect(() => {
    const currentErrors = validateFormData(formData);
    setErrors(currentErrors);
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
            error={errors.url}
            helpText="ワイルドカード（*）を使用できます（任意入力）"
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

          <OTPAuthURIField
            label="OTPAuth URI"
            value={formData.otpuri}
            onChange={(value) => handleFieldChange('otpuri', value)}
            onParsedDataChange={handleOTPDataChange}
            placeholder="otpauth://totp/Example:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example"
            rows={4}
          />
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
