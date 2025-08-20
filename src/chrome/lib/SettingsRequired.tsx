import React, { createContext, useContext, useEffect, useState } from 'react';

import { getSettings, isSettingsComplete } from './storage';
import type { ExtensionSettings } from './types';

interface SettingsRequiredProps {
  children: React.ReactNode;
  className?: string;
}

interface SettingsContextValue {
  settings: ExtensionSettings | null;
  loading: boolean;
  isComplete: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/**
 * 設定の状態を取得するためのhook
 * SettingsRequiredコンポーネント内でのみ使用可能
 */
export const useSettings = (): SettingsContextValue => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsRequired');
  }
  return context;
};

/**
 * 設定済みかどうか確認してから子コンポーネントを表示するラッパーコンポーネント
 * 設定が未完了の場合は「設定が必要です」画面を表示
 * 設定の状態はReact Contextを通じて子コンポーネントから取得可能
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

  const isComplete = settings ? isSettingsComplete(settings) : false;
  const contextValue: SettingsContextValue = {
    settings,
    loading,
    isComplete,
  };

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

  if (!isComplete) {
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

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsRequired;
