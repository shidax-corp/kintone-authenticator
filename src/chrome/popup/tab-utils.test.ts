/**
 * @jest-environment jsdom
 */
import { getActiveTabSiteName } from './tab-utils';

// Chrome API のモック
const mockChrome = {
  tabs: {
    query: jest.fn(),
  },
  scripting: {
    executeScript: jest.fn(),
  },
};

// グローバルのchromeオブジェクトをモック
(global as any).chrome = mockChrome;

describe('tab-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveTabSiteName', () => {
    it('should return og:site_name when script execution succeeds', async () => {
      const mockTab = { id: 1, title: 'Page Title' };
      mockChrome.tabs.query.mockResolvedValue([mockTab]);
      mockChrome.scripting.executeScript.mockResolvedValue([
        { result: 'Site Name from og:site_name' },
      ]);

      const result = await getActiveTabSiteName();

      expect(result).toBe('Site Name from og:site_name');
      expect(mockChrome.tabs.query).toHaveBeenCalledWith({
        active: true,
        currentWindow: true,
      });
      expect(mockChrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 1 },
        func: expect.any(Function),
      });
    });

    it('should fallback to tab title when script execution fails', async () => {
      const mockTab = { id: 1, title: 'Page Title' };
      mockChrome.tabs.query.mockResolvedValue([mockTab]);
      mockChrome.scripting.executeScript.mockRejectedValue(
        new Error('Script failed')
      );

      const result = await getActiveTabSiteName();

      expect(result).toBe('Page Title');
    });

    it('should return empty string when no active tab found', async () => {
      mockChrome.tabs.query.mockResolvedValue([]);

      const result = await getActiveTabSiteName();

      expect(result).toBe('');
    });

    it('should return empty string when tab has no id', async () => {
      const mockTab = { title: 'Page Title' }; // id がない
      mockChrome.tabs.query.mockResolvedValue([mockTab]);

      const result = await getActiveTabSiteName();

      expect(result).toBe('');
    });

    it('should fallback to tab title when script result is empty', async () => {
      const mockTab = { id: 1, title: 'Page Title' };
      mockChrome.tabs.query.mockResolvedValue([mockTab]);
      mockChrome.scripting.executeScript.mockResolvedValue([{ result: '' }]);

      const result = await getActiveTabSiteName();

      expect(result).toBe('Page Title');
    });

    it('should handle tabs.query failure in fallback', async () => {
      mockChrome.tabs.query
        .mockResolvedValueOnce([{ id: 1, title: 'Page Title' }]) // 最初の呼び出し
        .mockRejectedValueOnce(new Error('Query failed')); // フォールバックでの呼び出し
      mockChrome.scripting.executeScript.mockRejectedValue(
        new Error('Script failed')
      );

      const result = await getActiveTabSiteName();

      expect(result).toBe('');
    });
  });
});
