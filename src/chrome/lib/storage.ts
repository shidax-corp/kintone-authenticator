import type { ExtensionSettings } from './types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const SETTINGS_KEY = 'kintone_authenticator_settings';
const CACHE_KEY = 'kintone_authenticator_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getSettings = async (): Promise<ExtensionSettings | null> => {
  try {
    const result = await chrome.storage.local.get(SETTINGS_KEY);
    return result[SETTINGS_KEY] || null;
  } catch {
    return null;
  }
};

export const saveSettings = async (
  settings: ExtensionSettings
): Promise<void> => {
  try {
    await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
  } catch {
    throw new Error('Failed to save settings');
  }
};

export const isSettingsComplete = (
  settings: ExtensionSettings | null
): settings is ExtensionSettings => {
  if (!settings) return false;

  return !!(
    settings.kintoneBaseUrl &&
    settings.kintoneAppId &&
    settings.kintoneUsername &&
    settings.kintonePassword
  );
};

const isCacheEntry = (
  value: unknown
): value is CacheEntry<kintone.types.SavedFields[]> => {
  if (!value || typeof value !== 'object') return false;

  const cache = value as Record<string, unknown>;

  // timestampプロパティが存在し、number型であることを確認
  if (typeof cache.timestamp !== 'number') return false;

  // timestampが有効な数値であることを確認（NaN、Infinity、-Infinityを除外）
  if (!Number.isFinite(cache.timestamp)) return false;

  // dataプロパティが存在し、配列型であることを確認
  if (!Array.isArray(cache.data)) return false;

  return true;
};

export const getCachedRecords = async (): Promise<
  kintone.types.SavedFields[] | null
> => {
  try {
    const result = await chrome.storage.local.get(CACHE_KEY);
    const cache = result[CACHE_KEY];

    // キャッシュが有効なCacheEntry型であることを検証
    if (!isCacheEntry(cache)) return null;

    const isStale = Date.now() - cache.timestamp > CACHE_DURATION;
    return isStale ? null : cache.data;
  } catch {
    return null;
  }
};

export const setCachedRecords = async (
  records: kintone.types.SavedFields[]
): Promise<void> => {
  try {
    const cache: CacheEntry<kintone.types.SavedFields[]> = {
      data: records,
      timestamp: Date.now(),
    };
    await chrome.storage.local.set({ [CACHE_KEY]: cache });
  } catch {
    // Cache storage failure is not critical, silently ignore
  }
};
