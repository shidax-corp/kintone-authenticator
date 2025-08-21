import React, { useEffect, useState } from 'react';

import {
  type OTPAuthRecord,
  decodeOTPAuthURI,
  isValidOTPAuthURI,
} from '@lib/otpauth-uri';

import InputField from '@components/InputField';
import OTPInputField from '@components/OTPInputField';

export interface RegisterFormData {
  name: string;
  url: string;
  username: string;
  password: string;
  otpAuthUri: string;
}

export interface RegisterFormLogicProps {
  otpAuthUri?: string;
  initialPageTitle?: string;
  initialPageUrl?: string;
  onSubmit: (data: RegisterFormData) => Promise<void>;
  getTabInfo?: () => Promise<{ name: string; url: string }>;
}

export interface RegisterFormLogicRenderProps {
  formData: RegisterFormData;
  loading: boolean;
  error: string | null;
  fieldErrors: { [key: string]: string };
  handleInputChange: (field: keyof RegisterFormData, value: string) => void;
  handleOTPChange: (value: string, info: OTPAuthRecord | null) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isFormValid: boolean;
  formFields: React.ReactElement;
}

/**
 * 登録フォームの共通ロジックを提供するコンポーネント
 * render props パターンを使用してUIの描画を委譲する
 */
export const RegisterFormLogic: React.FC<
  RegisterFormLogicProps & {
    children: (props: RegisterFormLogicRenderProps) => React.ReactElement;
  }
> = ({
  otpAuthUri,
  initialPageTitle,
  initialPageUrl,
  onSubmit,
  getTabInfo,
  children,
}) => {
  const [formData, setFormData] = useState<RegisterFormData>({
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
    // Get current tab information to pre-fill form
    if (getTabInfo) {
      getTabInfo()
        .then(({ name, url }) => {
          setFormData((prev) => ({
            ...prev,
            name: prev.name || name,
            url: prev.url || url,
          }));
        })
        .catch(() => {
          // Ignore errors in tab info retrieval
        });
    }

    // If OTPAuth URI is provided, extract information
    if (!otpAuthUri) return;
    
    const loadOTPAuthInfo = async () => {
      try {
        const isValid = await isValidOTPAuthURI(otpAuthUri);
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
      } catch {
        // Handle validation error silently
      }
    };
    
    loadOTPAuthInfo();
  }, [otpAuthUri, initialPageTitle, initialPageUrl, getTabInfo]);

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleOTPChange = (value: string, info: OTPAuthRecord | null) => {
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
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'サイトの名前は必須です';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '登録中にエラーが発生しました'
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name.trim() !== '';

  // 共通のフォームフィールドコンポーネント
  const formFields = (
    <>
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
    </>
  );

  return children({
    formData,
    loading,
    error,
    fieldErrors,
    handleInputChange,
    handleOTPChange,
    handleSubmit,
    isFormValid,
    formFields,
  });
};