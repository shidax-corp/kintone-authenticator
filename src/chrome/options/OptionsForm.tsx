import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings, isSettingsComplete } from '../lib/storage';
import type { ExtensionSettings } from '../lib/types';

interface TestResult {
  success: boolean;
  message: string;
}

export const OptionsForm: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings>({
    kintoneBaseUrl: '',
    kintoneUsername: '',
    kintonePassword: '',
    passphrase: '',
    autoFillEnabled: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const existingSettings = await getSettings();
      if (existingSettings) {
        setSettings(existingSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ExtensionSettings, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setTestResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTestResult(null);

    try {
      // 保存前に接続テストを実行
      const connectionResponse = await chrome.runtime.sendMessage({
        type: 'TEST_CONNECTION',
        data: settings
      });

      if (!connectionResponse.success) {
        setTestResult({
          success: false,
          message: 'kintoneへの接続に失敗しました。設定を確認してください。'
        });
        return;
      }

      // 接続テストが成功した場合のみ設定を保存
      await saveSettings(settings);
      setTestResult({
        success: true,
        message: '設定を保存しました。'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `設定の保存に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'TEST_CONNECTION',
        data: settings
      });

      if (response.success) {
        setTestResult({
          success: true,
          message: 'kintoneへの接続に成功しました。'
        });
      } else {
        setTestResult({
          success: false,
          message: 'kintoneへの接続に失敗しました。設定を確認してください。'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `接続テストに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setTesting(false);
    }
  };

  const isFormValid = isSettingsComplete(settings);

  if (loading) {
    return <div className="loading">設定を読み込み中...</div>;
  }

  return (
    <div className="options-form">
      <style jsx>{`
        .options-form {
          max-width: 600px;
          margin: 0 auto;
          padding: 32px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .form-header {
          margin-bottom: 32px;
          text-align: center;
        }

        .form-header h1 {
          margin: 0 0 8px 0;
          color: #3498db;
          font-size: 24px;
        }

        .form-header p {
          margin: 0;
          color: #666;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
        }

        .required {
          color: #e74c3c;
        }

        .form-group input[type="text"],
        .form-group input[type="password"],
        .form-group input[type="url"] {
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.3s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: #3498db;
        }

        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .checkbox-group input[type="checkbox"] {
          width: 16px;
          height: 16px;
        }

        .button-group {
          display: flex;
          gap: 12px;
          margin-top: 32px;
        }

        .button {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .button-primary {
          background-color: #3498db;
          color: white;
        }

        .button-primary:hover:not(:disabled) {
          background-color: #2980b9;
        }

        .button-secondary {
          background-color: #95a5a6;
          color: white;
        }

        .button-secondary:hover:not(:disabled) {
          background-color: #7f8c8d;
        }

        .test-result {
          margin-top: 16px;
          padding: 12px;
          border-radius: 6px;
          font-size: 14px;
        }

        .test-result.success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .test-result.error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .loading {
          text-align: center;
          padding: 64px;
          color: #666;
        }

        .help-text {
          font-size: 12px;
          color: #666;
          margin-top: 4px;
        }
      `}</style>

      <div className="form-header">
        <h1>kintone Authenticator 設定</h1>
        <p>kintoneとの連携設定を行います</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="kintoneBaseUrl">
            kintoneドメイン <span className="required">*</span>
          </label>
          <input
            id="kintoneBaseUrl"
            type="url"
            value={settings.kintoneBaseUrl}
            onChange={(e) => handleInputChange('kintoneBaseUrl', e.target.value)}
            placeholder="https://example.cybozu.com"
            required
          />
          <div className="help-text">
            例: https://example.cybozu.com
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="kintoneUsername">
            kintoneユーザー名 <span className="required">*</span>
          </label>
          <input
            id="kintoneUsername"
            type="text"
            value={settings.kintoneUsername}
            onChange={(e) => handleInputChange('kintoneUsername', e.target.value)}
            placeholder="username"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="kintonePassword">
            kintoneパスワード <span className="required">*</span>
          </label>
          <input
            id="kintonePassword"
            type="password"
            value={settings.kintonePassword}
            onChange={(e) => handleInputChange('kintonePassword', e.target.value)}
            placeholder="password"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="passphrase">
            暗号化パスフレーズ <span className="required">*</span>
          </label>
          <input
            id="passphrase"
            type="password"
            value={settings.passphrase}
            onChange={(e) => handleInputChange('passphrase', e.target.value)}
            placeholder="暗号化用のパスフレーズを入力"
            required
          />
          <div className="help-text">
            OTPAuth URIとパスワードの暗号化に使用されます
          </div>
        </div>

        <div className="form-group">
          <div className="checkbox-group">
            <input
              id="autoFillEnabled"
              type="checkbox"
              checked={settings.autoFillEnabled}
              onChange={(e) => handleInputChange('autoFillEnabled', e.target.checked)}
            />
            <label htmlFor="autoFillEnabled">
              自動入力を有効にする
            </label>
          </div>
          <div className="help-text">
            ページの読み込み時に自動的にユーザー名とパスワードを入力します
          </div>
        </div>

        <div className="button-group">
          <button
            type="submit"
            className="button button-primary"
            disabled={!isFormValid || saving}
          >
            {saving ? '保存中...' : '設定を保存'}
          </button>
          
          <button
            type="button"
            className="button button-secondary"
            onClick={testConnection}
            disabled={!isFormValid || testing}
          >
            {testing ? '接続確認中...' : '接続テスト'}
          </button>
        </div>

        {testResult && (
          <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
            {testResult.message}
          </div>
        )}
      </form>
    </div>
  );
};