import React, { useCallback, useEffect, useState } from 'react';

import { filterRecords } from '@lib/search';

import SearchField from '@components/SearchField';

import { RecordItem } from '../lib/RecordItem';
import { isSettingsComplete } from '../lib/storage';
import type { ExtensionSettings } from '../lib/types';
import ModalBase from './ModalBase';

interface SelectorModalProps {
  onClose: () => void;
  onFieldSelect: (
    type: 'username' | 'password' | 'otp',
    value: string,
    recordId?: string
  ) => void;
  initialRecords?: kintone.types.SavedFields[];
  allRecords?: kintone.types.SavedFields[];
  initialSearchQuery?: string;
}

/**
 * OTP選択機能専用モーダル
 * レコード一覧から選択してフィールドに入力する
 */
export const SelectorModal: React.FC<SelectorModalProps> = ({
  onClose,
  onFieldSelect,
  initialRecords,
  allRecords,
  initialSearchQuery = '',
}) => {
  const [records, setRecords] = useState<kintone.types.SavedFields[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<
    kintone.types.SavedFields[]
  >([]);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [fetchError, setFetchError] = useState<boolean>(false);

  const loadInitialData = useCallback(async () => {
    try {
      setFetchError(false);

      // 初期レコードが渡されている場合はそれを使用
      if (initialRecords || allRecords) {
        const settingsResponse = await chrome.runtime.sendMessage({
          type: 'GET_SETTINGS',
        });
        if (settingsResponse.success) {
          setSettings(settingsResponse.data);
        }

        // allRecordsが利用可能な場合はそれをrecordsに設定、そうでなければinitialRecordsを使用
        setRecords(allRecords || initialRecords || []);
      } else {
        // 従来通りの処理
        const [settingsResponse, recordsResponse] = await Promise.all([
          chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }),
          chrome.runtime.sendMessage({ type: 'GET_RECORDS' }),
        ]);

        if (settingsResponse.success) {
          setSettings(settingsResponse.data);
        }

        if (recordsResponse.success) {
          setRecords(recordsResponse.data);
        } else {
          setFetchError(true);
          setRecords([]);
        }
      }
    } catch {
      setFetchError(true);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [initialRecords, allRecords]);

  const refreshRecords = async () => {
    setRefreshing(true);
    try {
      setFetchError(false);

      const response = await chrome.runtime.sendMessage({
        type: 'GET_RECORDS',
        data: { forceRefresh: true },
      });

      if (response.success) {
        setRecords(response.data);
      } else {
        setFetchError(true);
        setRecords([]);
      }
    } catch {
      setFetchError(true);
      setRecords([]);
    } finally {
      setRefreshing(false);
    }
  };

  const hasAnyValidField = (record: kintone.types.SavedFields): boolean => {
    return !!(
      record.username?.value ||
      record.password?.value ||
      record.otpuri?.value
    );
  };

  const filterRecordsCallback = useCallback(() => {
    // 検索に使用するレコードを決定（allRecordsが利用可能ならそれを使用、そうでなければrecords）
    const searchableRecords = allRecords || records;

    // まず有効なフィールドを持つレコードのみに絞り込み
    const recordsWithValidFields = searchableRecords.filter(hasAnyValidField);

    if (!searchQuery.trim()) {
      setFilteredRecords(recordsWithValidFields);
      return;
    }

    // @lib/searchのfilterRecordsを使用して検索処理
    const filtered = filterRecords(recordsWithValidFields, searchQuery);
    setFilteredRecords(filtered);
  }, [allRecords, records, searchQuery]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    filterRecordsCallback();
  }, [records, searchQuery, filterRecordsCallback]);

  if (loading) {
    return (
      <ModalBase onClose={onClose}>
        <div className="selector-modal">
          <div className="loading">
            <div className="spinner"></div>
            <p>読み込み中...</p>
          </div>
          <style jsx>{`
            .selector-modal {
              width: 400px;
              max-height: 600px;
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
      </ModalBase>
    );
  }

  if (!settings || !isSettingsComplete(settings)) {
    return (
      <ModalBase onClose={onClose}>
        <div className="selector-modal">
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
            .selector-modal {
              width: 400px;
              max-height: 600px;
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
      </ModalBase>
    );
  }

  return (
    <ModalBase onClose={onClose}>
      <div className="selector-modal">
        <div className="header">
          <div className="header-title">
            <h1>kintoneから入力</h1>
            <button className="close-button" onClick={onClose} title="閉じる">
              ✕
            </button>
          </div>
          <div className="search-container">
            <SearchField value={searchQuery} onChange={setSearchQuery} />
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
          {fetchError ? (
            <div className="error-state">
              データの取得に失敗しました。
              <br />
              <a
                href=""
                onClick={(ev) => {
                  ev.preventDefault();
                  chrome.runtime.openOptionsPage();
                }}
                style={{ color: 'inherit' }}
              >
                設定
              </a>
              を確認してください
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="empty-state">
              {searchQuery
                ? '検索条件に一致するレコードがありません'
                : 'レコードがありません'}
            </div>
          ) : (
            <ul className="records-list">
              {filteredRecords.map((record) => (
                <RecordItem
                  key={record.$id.value}
                  record={record}
                  onFieldSelect={onFieldSelect}
                  isModal={true}
                />
              ))}
            </ul>
          )}
        </div>

        <style jsx>{`
          .selector-modal {
            width: 400px;
            max-height: 600px;
            font-family:
              -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
          }

          .header {
            padding: 16px;
            border-bottom: 1px solid var(--ka-bg-dark-color);
            background: var(--ka-bg-tint-color);
          }

          .header-title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }

          .header h1 {
            margin: 0;
            font-size: 18px;
            color: var(--ka-fg-color);
          }

          .close-button {
            background: none;
            border: none;
            font-size: 20px;
            color: var(--ka-fg-light-color);
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
          }

          .close-button:hover {
            background: var(--ka-bg-dark-color);
            color: var(--ka-fg-color);
          }

          .search-container {
            display: flex;
            gap: 8px;
            align-items: center;
          }

          .refresh-button {
            padding: 8px;
            border: 1px solid var(--ka-bg-dark-color);
            border-radius: 4px;
            background: var(--ka-bg-input-color);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .refresh-button:hover {
            background: var(--ka-bg-tint-color);
          }

          .refresh-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .records-container {
            flex: 1;
            overflow-y: auto;
            max-height: 400px;
            background: var(--ka-bg-color);
          }

          .records-list {
            display: block;
            list-style: none;
            padding: 8px;
            margin: 0;
          }

          .records-list > :global(li) {
            break-inside: avoid;
            margin-bottom: 16px;
          }

          .error-state {
            padding: 48px 24px;
            text-align: center;
            color: var(--ka-fg-error-color);
            background: var(--ka-bg-error-color);
            border: 1px solid var(--ka-fg-error-color);
            border-radius: 4px;
            margin: 16px;
          }

          .empty-state {
            padding: 48px 24px;
            text-align: center;
            color: var(--ka-fg-light-color);
          }
        `}</style>
      </div>
    </ModalBase>
  );
};

export default SelectorModal;
