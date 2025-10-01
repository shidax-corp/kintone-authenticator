import { useEffect, useState } from 'react';

import type { ExtensionSettings } from './types';

/**
 * Chrome拡張の設定を取得し、状態を管理するReactフック。
 *
 * @returns 設定とloading状態
 */
export function useSettings() {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsResponse = await chrome.runtime.sendMessage({
          type: 'GET_SETTINGS',
        });
        if (settingsResponse.success) {
          setSettings(settingsResponse.data);
        }
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  return { settings, loading };
}
