import type { ExtensionSettings, KintoneRecord, CacheEntry } from './types';

const SETTINGS_KEY = 'kintone_authenticator_settings';
const CACHE_KEY = 'kintone_authenticator_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getSettings = async (): Promise<ExtensionSettings | null> => {
  try {
    const result = await chrome.storage.sync.get(SETTINGS_KEY);
    return result[SETTINGS_KEY] || null;
  } catch {
    return null;
  }
};

export const saveSettings = async (settings: ExtensionSettings): Promise<void> => {
  try {
    await chrome.storage.sync.set({ [SETTINGS_KEY]: settings });
  } catch {
    throw new Error('Failed to save settings');
  }
};

export const isSettingsComplete = (settings: ExtensionSettings | null): settings is ExtensionSettings => {
  if (!settings) return false;

  return !!(
    settings.kintoneBaseUrl &&
    settings.kintoneUsername &&
    settings.kintonePassword
  );
};

export const getCachedRecords = async (): Promise<KintoneRecord[] | null> => {
  try {
    const result = await chrome.storage.local.get(CACHE_KEY);
    const cache: CacheEntry<KintoneRecord[]> = result[CACHE_KEY];

    if (!cache) return null;

    const isStale = Date.now() - cache.timestamp > CACHE_DURATION;
    return isStale ? null : cache.data;
  } catch {
    return null;
  }
};

export const setCachedRecords = async (records: KintoneRecord[]): Promise<void> => {
  try {
    const cache: CacheEntry<KintoneRecord[]> = {
      data: records,
      timestamp: Date.now()
    };
    await chrome.storage.local.set({ [CACHE_KEY]: cache });
  } catch {
  }
};

export const clearCache = async (): Promise<void> => {
  try {
    await chrome.storage.local.remove(CACHE_KEY);
  } catch {
  }
};

export const clearAllData = async (): Promise<void> => {
  try {
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();
  } catch (error) {
    throw new Error(`Failed to clear all data: ${error}`);
  }
};
