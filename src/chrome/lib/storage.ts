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

export const getCachedRecords = async (): Promise<
  kintone.types.SavedFields[] | null
> => {
  try {
    const result = await chrome.storage.local.get(CACHE_KEY);
    const cache: CacheEntry<kintone.types.SavedFields[]> = result[CACHE_KEY];

    if (!cache) return null;

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

export const clearCache = async (): Promise<void> => {
  try {
    await chrome.storage.local.remove(CACHE_KEY);
  } catch {
    // Cache removal failure is not critical, silently ignore
  }
};

export const clearAllData = async (): Promise<void> => {
  try {
    await chrome.storage.local.clear();
  } catch (error) {
    throw new Error(`Failed to clear all data: ${error}`);
  }
};
