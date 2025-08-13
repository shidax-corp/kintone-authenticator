import React, { useState, useEffect, useMemo } from 'react';
import { generateTOTP } from '../../lib/gen-otp';
import { decodeOTPAuthURI } from '../../lib/otpauth-uri';
import { prettifyOTP } from '../../lib/gen-otp';
import { getSettings, isSettingsComplete } from '../lib/storage';
import type { KintoneRecord, ExtensionSettings } from '../lib/types';

interface SelectionViewProps {
  onRegister: () => void;
}

export const SelectionView: React.FC<SelectionViewProps> = ({ onRegister }) => {
  const [records, setRecords] = useState<KintoneRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<KintoneRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [otpData, setOtpData] = useState<{ [recordId: string]: { otp: string; remaining: number } }>({});

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [records, searchQuery]);

  useEffect(() => {
    const interval = setInterval(updateOTPs, 1000);
    return () => clearInterval(interval);
  }, [filteredRecords]);

  const loadInitialData = async () => {
    try {
      const [settingsResponse, recordsResponse] = await Promise.all([
        chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }),
        chrome.runtime.sendMessage({ type: 'GET_RECORDS' })
      ]);

      if (settingsResponse.success) {
        setSettings(settingsResponse.data);
      }

      if (recordsResponse.success) {
        setRecords(recordsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshRecords = async () => {
    setRefreshing(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_RECORDS',
        data: { forceRefresh: true }
      });

      if (response.success) {
        setRecords(response.data);
      }
    } catch (error) {
      console.error('Failed to refresh records:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const filterRecords = () => {
    if (!searchQuery.trim()) {
      setFilteredRecords(records);
      return;
    }

    const queries = searchQuery.toLowerCase().split(' ').filter(q => q.length > 0);
    const filtered = records.filter(record => {
      const searchableText = `${record.name} ${record.url}`.toLowerCase();
      return queries.every(query => searchableText.includes(query));
    });

    setFilteredRecords(filtered);
  };

  const updateOTPs = async () => {
    const newOtpData: { [recordId: string]: { otp: string; remaining: number } } = {};

    for (const record of filteredRecords) {
      if (record.otpAuthUri) {
        try {
          const response = await chrome.runtime.sendMessage({
            type: 'GET_OTP',
            data: { recordId: record.recordId }
          });

          if (response.success) {
            const now = Date.now();
            const period = 30000; // 30 seconds in milliseconds
            const remaining = period - (now % period);

            newOtpData[record.recordId] = {
              otp: response.data.otp,
              remaining: Math.ceil(remaining / 1000)
            };
          }
        } catch (error) {
          console.error(`Failed to generate OTP for record ${record.recordId}:`, error);
        }
      }
    }

    setOtpData(newOtpData);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await chrome.runtime.sendMessage({
        type: 'COPY_TO_CLIPBOARD',
        data: { text }
      });
      
      // Show temporary notification
      const button = document.activeElement as HTMLElement;
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'コピーしました!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!settings || !isSettingsComplete(settings)) {
    return (
      <div className="setup-required">
        <h2>設定が必要です</h2>
        <p>kintone Authenticatorを使用するには、まず設定を完了してください。</p>
        <button 
          className="button button-primary"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          設定画面を開く
        </button>
      </div>
    );
  }

  return (
    <div className="selection-view">
      <style jsx>{`
        .selection-view {
          width: 400px;
          max-height: 600px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          flex-direction: column;
        }

        .header {
          padding: 16px;
          border-bottom: 1px solid #e0e0e0;
          background: #f8f9fa;
        }

        .header h1 {
          margin: 0 0 12px 0;
          font-size: 18px;
          color: #333;
        }

        .search-container {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .search-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .refresh-button {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .refresh-button:hover {
          background: #f5f5f5;
        }

        .refresh-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .records-container {
          flex: 1;
          overflow-y: auto;
          max-height: 400px;
        }

        .record-item {
          padding: 16px;
          border-bottom: 1px solid #e0e0e0;
        }

        .record-name {
          font-weight: 500;
          color: #333;
          margin-bottom: 4px;
        }

        .record-url {
          font-size: 12px;
          color: #666;
          margin-bottom: 12px;
          word-break: break-all;
        }

        .record-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .record-actions.with-otp {
          grid-template-columns: 1fr 1fr 2fr;
        }

        .action-button {
          padding: 6px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          font-size: 12px;
          text-align: center;
        }

        .action-button:hover {
          background: #f5f5f5;
        }

        .otp-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px;
          background: #e3f2fd;
          border-color: #2196f3;
        }

        .otp-value {
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 16px;
          font-weight: bold;
          color: #1976d2;
          margin-bottom: 2px;
        }

        .otp-timer {
          font-size: 10px;
          color: #666;
        }

        .footer {
          padding: 16px;
          border-top: 1px solid #e0e0e0;
          background: #f8f9fa;
        }

        .add-button {
          width: 100%;
          padding: 12px;
          border: 2px dashed #3498db;
          border-radius: 6px;
          background: white;
          color: #3498db;
          cursor: pointer;
          font-weight: 500;
        }

        .add-button:hover {
          background: #f0f8ff;
        }

        .empty-state {
          padding: 48px 24px;
          text-align: center;
          color: #666;
        }

        .loading {
          padding: 48px 24px;
          text-align: center;
          color: #666;
        }

        .spinner {
          border: 2px solid #f3f3f3;
          border-top: 2px solid #3498db;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .setup-required {
          padding: 48px 24px;
          text-align: center;
        }

        .setup-required h2 {
          margin: 0 0 16px 0;
          color: #333;
        }

        .setup-required p {
          margin: 0 0 24px 0;
          color: #666;
        }

        .button {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }

        .button-primary {
          background: #3498db;
          color: white;
        }

        .button-primary:hover {
          background: #2980b9;
        }
      `}</style>

      <div className="header">
        <h1>kintone Authenticator</h1>
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="名前やURLで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className="refresh-button"
            onClick={refreshRecords}
            disabled={refreshing}
            title="更新"
          >
            {refreshing ? '🔄' : '↻'}
          </button>
        </div>
      </div>

      <div className="records-container">
        {filteredRecords.length === 0 ? (
          <div className="empty-state">
            {searchQuery ? '検索条件に一致するレコードがありません' : 'レコードがありません'}
          </div>
        ) : (
          filteredRecords.map(record => (
            <div key={record.recordId} className="record-item">
              <div className="record-name">{record.name}</div>
              <div className="record-url">{record.url}</div>
              <div className={`record-actions ${record.otpAuthUri ? 'with-otp' : ''}`}>
                <button
                  className="action-button"
                  onClick={() => copyToClipboard(record.username, 'username')}
                >
                  ユーザー名
                </button>
                <button
                  className="action-button"
                  onClick={() => copyToClipboard(record.password, 'password')}
                >
                  パスワード
                </button>
                {record.otpAuthUri && otpData[record.recordId] && (
                  <button
                    className="action-button otp-button"
                    onClick={() => copyToClipboard(otpData[record.recordId].otp, 'otp')}
                  >
                    <div className="otp-value">
                      {prettifyOTP(otpData[record.recordId].otp)}
                    </div>
                    <div className="otp-timer">
                      {otpData[record.recordId].remaining}s
                    </div>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="footer">
        <button className="add-button" onClick={onRegister}>
          ＋ 新しいサイトを登録
        </button>
      </div>
    </div>
  );
};