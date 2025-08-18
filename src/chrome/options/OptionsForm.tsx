import React, { useEffect, useState } from 'react';

import InputField from '@components/InputField';

import { getSettings, isSettingsComplete, saveSettings } from '../lib/storage';
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
    } catch {
      // Settings loading failure is not critical
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof ExtensionSettings,
    value: string | boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
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
        data: settings,
      });

      if (!connectionResponse.success) {
        setTestResult({
          success: false,
          message: 'kintoneへの接続に失敗しました。設定を確認してください。',
        });
        return;
      }

      // 接続テストが成功した場合のみ設定を保存
      await saveSettings(settings);
      setTestResult({
        success: true,
        message: '設定を保存しました。',
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `設定の保存に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
        data: settings,
      });

      if (response.success) {
        setTestResult({
          success: true,
          message: 'kintoneへの接続に成功しました。',
        });
      } else {
        setTestResult({
          success: false,
          message: 'kintoneへの接続に失敗しました。設定を確認してください。',
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `接続テストに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
          font-family:
            -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .form-header {
          margin-bottom: 32px;
          text-align: center;
        }

        .form-header h1 {
          margin: 0 0 8px 0;
          color: var(--ka-primary-color);
          font-size: 24px;
        }

        .form-header p {
          margin: 0;
          color: var(--ka-fg-light-color);
        }

        .form-group {
          margin-bottom: 24px;
        }

        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background-color: var(--ka-bg-tint-color);
          border-radius: 6px;
        }

        .checkbox-group input[type='checkbox'] {
          width: 16px;
          height: 16px;
        }

        .checkbox-group label {
          font-weight: 500;
          color: var(--ka-fg-color);
          cursor: pointer;
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
          background-color: var(--ka-primary-color);
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
          background-color: var(--ka-bg-error-color);
          color: var(--ka-fg-error-color);
          border: 1px solid var(--ka-fg-error-color);
        }

        .loading {
          text-align: center;
          padding: 64px;
          color: var(--ka-fg-light-color);
        }

        .help-text {
          font-size: 12px;
          color: var(--ka-fg-light-color);
          margin-top: 4px;
        }
      `}</style>

      <div className="form-header">
        <h1>kintone Authenticator 設定</h1>
        <p>kintoneとの連携設定を行います</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <InputField
            type="url"
            label="kintoneドメイン"
            placeholder="https://example.cybozu.com"
            value={settings.kintoneBaseUrl}
            onChange={(value) => handleInputChange('kintoneBaseUrl', value)}
            required
          />
          <div className="help-text">例: https://example.cybozu.com</div>
        </div>

        <div className="form-group">
          <InputField
            type="text"
            label="kintoneユーザー名"
            placeholder="username"
            value={settings.kintoneUsername}
            onChange={(value) => handleInputChange('kintoneUsername', value)}
            required
          />
        </div>

        <div className="form-group">
          <InputField
            type="password"
            label="kintoneパスワード"
            placeholder="password"
            value={settings.kintonePassword}
            onChange={(value) => handleInputChange('kintonePassword', value)}
            required
          />
        </div>

        <div className="form-group">
          <div className="checkbox-group">
            <input
              id="autoFillEnabled"
              type="checkbox"
              checked={settings.autoFillEnabled}
              onChange={(e) =>
                handleInputChange('autoFillEnabled', e.target.checked)
              }
            />
            <label htmlFor="autoFillEnabled">自動入力を有効にする</label>
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
          <div
            className={`test-result ${testResult.success ? 'success' : 'error'}`}
          >
            {testResult.message}
          </div>
        )}
      </form>
    </div>
  );
};
