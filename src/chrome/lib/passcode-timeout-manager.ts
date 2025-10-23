import { ChromeLocalStorage } from './keychain-storage';

const ALARM_NAME = 'passcode-timeout-check';
const CHECK_INTERVAL_MINUTES = 1; // 1分ごとにチェック

/**
 * アラームハンドラー
 * モジュールロード時に1回だけ登録される
 */
const handleAlarm = async (alarm: chrome.alarms.Alarm) => {
  if (alarm.name === ALARM_NAME) {
    const storage = new ChromeLocalStorage();
    await storage.clearIfExpired();
  }
};

// リスナーをグローバルスコープで1回だけ登録
chrome.alarms.onAlarm.addListener(handleAlarm);

/**
 * Background serviceでタイムアウトチェックを開始
 */
export const startPasscodeTimeoutManager = async () => {
  // 既存のアラームをクリア
  await chrome.alarms.clear(ALARM_NAME);

  // 定期的にチェックするアラームを作成
  await chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: CHECK_INTERVAL_MINUTES,
  });
};

/**
 * タイムアウトマネージャーを停止
 */
export const stopPasscodeTimeoutManager = async () => {
  await chrome.alarms.clear(ALARM_NAME);
};
