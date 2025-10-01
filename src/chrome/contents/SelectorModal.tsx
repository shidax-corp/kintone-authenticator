import { useEffect, useMemo } from 'react';

import RefreshIcon from '@mui/icons-material/Refresh';

import { useSearch } from '@lib/search';

import SearchField from '@components/SearchField';

import { RecordItem } from '../lib/RecordItem';
import { hasAnyValidField } from '../lib/record-utils';
import { useRecords } from '../lib/records';
import { isSettingsComplete } from '../lib/storage';
import { useSettings } from '../lib/use-settings';
import ModalBase from './ModalBase';

interface SelectorModalProps {
  onClose: () => void;
  onFieldSelect: (
    type: 'username' | 'password' | 'otp',
    value: string,
    recordId?: string
  ) => void;
  records: kintone.types.SavedFields[];
  initialSearchQuery?: string;
}

/**
 * OTP選択機能専用モーダル
 * レコード一覧から選択してフィールドに入力する
 */
export const SelectorModal = ({
  onClose,
  onFieldSelect,
  records: recordsFromProps,
  initialSearchQuery = '',
}: SelectorModalProps) => {
  // 設定情報の取得
  const { settings, loading: settingsLoading } = useSettings();

  // レコード取得と状態管理（useRecordsフックを使用）
  const { records, loading, refreshing, fetchError, refresh } =
    useRecords(recordsFromProps);

  // 有効なフィールドを持つレコードのみをフィルタリング
  const validRecords = useMemo(
    () => records.filter(hasAnyValidField),
    [records]
  );

  // 検索機能（useSearchフックを使用）
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    records: filteredRecords,
    message,
  } = useSearch(validRecords);

  // 初期検索クエリの設定
  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery, setSearchQuery]);

  if (loading || settingsLoading) {
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
          <h1>kintoneから入力</h1>
          <div className="search-container">
            <SearchField value={searchQuery} onChange={setSearchQuery} />
            <button
              className="refresh-button"
              onClick={refresh}
              disabled={refreshing}
              title="更新"
            >
              <RefreshIcon className={refreshing ? 'spinning' : ''} />
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
          ) : filteredRecords.length === 0 && message ? (
            <div className="empty-state">{message}</div>
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

          .header h1 {
            margin: 0 0 12px 0;
            font-size: 18px;
            color: var(--ka-fg-color);
          }

          .search-container {
            display: flex;
            gap: 8px;
            align-items: stretch;
          }

          .search-container > :global(input) {
            border-radius: 4px;
            background-color: #fff;
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

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          .refresh-button :global(.spinning) {
            animation: spin 1s linear infinite;
          }
        `}</style>
      </div>
    </ModalBase>
  );
};

export default SelectorModal;
