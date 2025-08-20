import React, { useEffect, useState } from 'react';

import { getSettings, isSettingsComplete } from './storage';
import type { ExtensionSettings } from './types';

interface SettingsRequiredProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * 設定済みかどうか確認してから子コンポーネントを表示するラッパーコンポーネント
 * 設定が未完了の場合は「設定が必要です」画面を表示
 */
export const SettingsRequired: React.FC<SettingsRequiredProps> = ({
  children,
  className = '',
}) => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsData = await getSettings();
        setSettings(settingsData);
      } catch {
        // Settings loading failure is not critical
        setSettings(null);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  if (loading) {
    return (
      <div className={`settings-loading ${className}`}>
        <div className="loading">
          <div className="spinner"></div>
          <p>読み込み中...</p>
        </div>
        <style jsx>{`
          .settings-loading {
            display: flex;
            flex-direction: column;
          }

          .loading {
            padding: 48px 24px;
            text-align: center;
            color: var(--ka-fg-light-color);
          }

          .spinner {
            border: 2px solid var(--ka-bg-tint-color);
            border-top: 2px solid var(--ka-primary-color);
            border-radius: 50%;
            width: 24px;
            height: 24px;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
          }

          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  if (!settings || !isSettingsComplete(settings)) {
    return (
      <div className={`settings-required-wrapper ${className}`}>
        <div className="setup-required">
          <h2>設定が必要です</h2>
          <p>
            kintone Authenticatorを使用するには、まず設定を完了してください。
          </p>
          <button
            className="button button-primary"
            onClick={() => chrome.runtime.openOptionsPage()}
          >
            設定画面を開く
          </button>
        </div>
        <style jsx>{`
          .settings-required-wrapper {
            display: flex;
            flex-direction: column;
          }

          .setup-required {
            padding: 48px 24px;
            text-align: center;
          }

          .setup-required h2 {
            margin: 0 0 16px 0;
            color: var(--ka-fg-color);
          }

          .setup-required p {
            margin: 0 0 24px 0;
            color: var(--ka-fg-light-color);
          }

          .button {
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
          }

          .button-primary {
            background: var(--ka-primary-color);
            color: white;
          }

          .button-primary:hover {
            background: #2980b9;
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
};

export default SettingsRequired;