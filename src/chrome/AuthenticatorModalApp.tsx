import React, { useState } from 'react';

import GlobalStyle from '@components/GlobalStyle';

import { AuthenticatorWrapper } from './AuthenticatorWrapper';
import { RegisterForm } from './popup/RegisterForm';

type ViewMode = 'selection' | 'register';

interface AuthenticatorModalAppProps {
  onClose: () => void;
  onFieldSelect?: (
    type: 'username' | 'password' | 'otp',
    value: string,
    recordId?: string
  ) => void;
  initialRecords?: kintone.types.SavedFields[];
  allRecords?: kintone.types.SavedFields[];
  initialSearchQuery?: string;
  // QRコード読み取り後に登録フォームを直接表示する場合
  initialViewMode?: ViewMode;
  initialOtpAuthUri?: string;
  // content script環境での現在のページ情報
  initialPageTitle?: string;
  initialPageUrl?: string;
}

export const AuthenticatorModalApp: React.FC<AuthenticatorModalAppProps> = ({
  onClose,
  onFieldSelect,
  initialRecords,
  allRecords,
  initialSearchQuery,
  initialViewMode = 'selection',
  initialOtpAuthUri,
  initialPageTitle,
  initialPageUrl,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [registerOtpUri, setRegisterOtpUri] = useState<string | undefined>(
    initialOtpAuthUri
  );

  const handleRegister = (otpAuthUri?: string) => {
    setRegisterOtpUri(otpAuthUri);
    setViewMode('register');
  };

  const handleBack = () => {
    setRegisterOtpUri(undefined);
    setViewMode('selection');
  };

  const handleRegistrationSuccess = async (recordId?: string) => {
    // 登録成功後、最新のOTPを生成してコピー
    if (recordId) {
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'GET_OTP',
          data: { recordId },
        });

        if (response.success && response.data?.otp) {
          // OTPをクリップボードにコピー
          await navigator.clipboard.writeText(response.data.otp);

          // Toast表示
          const toast = document.createElement('div');
          toast.textContent = `OTPが登録され、クリップボードにコピーされました: ${response.data.otp}`;
          toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            z-index: 10001;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            max-width: 300px;
            word-wrap: break-word;
          `;
          document.body.appendChild(toast);

          setTimeout(() => {
            if (toast.parentNode) {
              toast.parentNode.removeChild(toast);
            }
          showToast(
            `OTPが登録され、クリップボードにコピーされました: ${response.data.otp}`,
            '#4caf50'
          );
        } else {
          throw new Error('OTP生成に失敗しました');
        }
      } catch (error) {
        console.error('OTP生成エラー:', error);

        // エラーToast表示
        const toast = document.createElement('div');
        toast.textContent = 'OTPは登録されましたが、OTPの生成に失敗しました';
        toast.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #ff9800;
          color: white;
          padding: 12px 24px;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          z-index: 10001;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          max-width: 300px;
          word-wrap: break-word;
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 5000);
      }
    } else {
      // recordIdがない場合
      const toast = document.createElement('div');
      toast.textContent = 'OTPが登録されました';
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        z-index: 10001;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        max-width: 300px;
        word-wrap: break-word;
      `;
      document.body.appendChild(toast);

      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 3000);
    }

    // 元の画面に戻る
    setRegisterOtpUri(undefined);
    setViewMode('selection');

    // 少し待ってからモーダルを閉じる
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <GlobalStyle>
      <div className="modal-overlay">
        <div className="modal-content">
          {viewMode === 'selection' && (
            <AuthenticatorWrapper
              onRegister={() => handleRegister()}
              isModal={true}
              onClose={onClose}
              onFieldSelect={onFieldSelect}
              initialRecords={initialRecords}
              allRecords={allRecords}
              initialSearchQuery={initialSearchQuery}
            />
          )}
          {viewMode === 'register' && (
            <RegisterForm
              otpAuthUri={registerOtpUri}
              onBack={handleBack}
              onSuccess={handleRegistrationSuccess}
              initialPageTitle={initialPageTitle}
              initialPageUrl={initialPageUrl}
            />
          )}
        </div>
        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
            box-sizing: border-box;
          }

          .modal-content {
            background: var(--ka-bg-color);
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            max-width: 90vw;
            max-height: 90vh;
            overflow: hidden;
            position: relative;
          }
        `}</style>
      </div>
    </GlobalStyle>
  );
};

export default AuthenticatorModalApp;
