import React from 'react';

import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import SettingsRequired, { useSettings } from './SettingsRequired';
import { getSettings, isSettingsComplete } from './storage';
import type { ExtensionSettings } from './types';

// Mock the storage module
jest.mock('./storage', () => ({
  getSettings: jest.fn(),
  isSettingsComplete: jest.fn(),
}));

const mockGetSettings = getSettings as jest.MockedFunction<typeof getSettings>;
const mockIsSettingsComplete = isSettingsComplete as jest.MockedFunction<
  typeof isSettingsComplete
>;

// Mock Chrome runtime API
const mockChrome = {
  runtime: {
    openOptionsPage: jest.fn(),
  },
};

(global as any).chrome = mockChrome;

// Test component for useSettings hook
const TestComponent: React.FC = () => {
  const { settings, loading, isComplete } = useSettings();
  return (
    <div>
      <div data-testid="loading">{loading ? 'true' : 'false'}</div>
      <div data-testid="is-complete">{isComplete ? 'true' : 'false'}</div>
      <div data-testid="settings">
        {settings ? settings.kintoneBaseUrl : 'null'}
      </div>
    </div>
  );
};

describe('SettingsRequired', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', async () => {
    mockGetSettings.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(null), 100))
    );

    render(
      <SettingsRequired>
        <div data-testid="child-content">Child Content</div>
      </SettingsRequired>
    );

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
  });

  it('shows setup required when settings are incomplete', async () => {
    const incompleteSettings: ExtensionSettings = {
      kintoneBaseUrl: '',
      kintoneUsername: 'user',
      kintonePassword: 'pass',
      autoFillEnabled: true,
    };

    mockGetSettings.mockResolvedValue(incompleteSettings);
    mockIsSettingsComplete.mockReturnValue(false);

    render(
      <SettingsRequired>
        <div data-testid="child-content">Child Content</div>
      </SettingsRequired>
    );

    await waitFor(() => {
      expect(screen.getByText('設定が必要です')).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        'kintone Authenticatorを使用するには、まず設定を完了してください。'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('設定画面を開く')).toBeInTheDocument();
    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
  });

  it('shows setup required when settings are null', async () => {
    mockGetSettings.mockResolvedValue(null);
    mockIsSettingsComplete.mockReturnValue(false);

    render(
      <SettingsRequired>
        <div data-testid="child-content">Child Content</div>
      </SettingsRequired>
    );

    await waitFor(() => {
      expect(screen.getByText('設定が必要です')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
  });

  it('renders children when settings are complete', async () => {
    const completeSettings: ExtensionSettings = {
      kintoneBaseUrl: 'https://example.cybozu.com',
      kintoneUsername: 'user',
      kintonePassword: 'pass',
      autoFillEnabled: true,
    };

    mockGetSettings.mockResolvedValue(completeSettings);
    mockIsSettingsComplete.mockReturnValue(true);

    render(
      <SettingsRequired>
        <div data-testid="child-content">Child Content</div>
      </SettingsRequired>
    );

    await waitFor(() => {
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    expect(screen.getByText('Child Content')).toBeInTheDocument();
    expect(screen.queryByText('設定が必要です')).not.toBeInTheDocument();
  });

  it('opens options page when setup button is clicked', async () => {
    mockGetSettings.mockResolvedValue(null);
    mockIsSettingsComplete.mockReturnValue(false);

    render(
      <SettingsRequired>
        <div data-testid="child-content">Child Content</div>
      </SettingsRequired>
    );

    await waitFor(() => {
      expect(screen.getByText('設定画面を開く')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('設定画面を開く'));

    expect(mockChrome.runtime.openOptionsPage).toHaveBeenCalledTimes(1);
  });

  it('applies custom className when provided', async () => {
    mockGetSettings.mockResolvedValue(null);
    mockIsSettingsComplete.mockReturnValue(false);

    const { container } = render(
      <SettingsRequired className="custom-class">
        <div data-testid="child-content">Child Content</div>
      </SettingsRequired>
    );

    await waitFor(() => {
      expect(screen.getByText('設定が必要です')).toBeInTheDocument();
    });

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('handles settings loading error gracefully', async () => {
    mockGetSettings.mockRejectedValue(new Error('Settings error'));
    mockIsSettingsComplete.mockReturnValue(false);

    render(
      <SettingsRequired>
        <div data-testid="child-content">Child Content</div>
      </SettingsRequired>
    );

    await waitFor(() => {
      expect(screen.getByText('設定が必要です')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
  });
});

describe('useSettings hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides settings context when used within SettingsRequired', async () => {
    const completeSettings: ExtensionSettings = {
      kintoneBaseUrl: 'https://example.cybozu.com',
      kintoneUsername: 'user',
      kintonePassword: 'pass',
      autoFillEnabled: true,
    };

    mockGetSettings.mockResolvedValue(completeSettings);
    mockIsSettingsComplete.mockReturnValue(true);

    render(
      <SettingsRequired>
        <TestComponent />
      </SettingsRequired>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('is-complete')).toHaveTextContent('true');
    expect(screen.getByTestId('settings')).toHaveTextContent(
      'https://example.cybozu.com'
    );
  });

  it('throws error when used outside SettingsRequired', () => {
    // Use jest.spyOn to capture console.error and prevent it from showing in test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useSettings must be used within SettingsRequired');

    consoleSpy.mockRestore();
  });

  it('provides loading state correctly', async () => {
    const completeSettings: ExtensionSettings = {
      kintoneBaseUrl: 'https://test.cybozu.com',
      kintoneUsername: 'testuser',
      kintonePassword: 'testpass',
      autoFillEnabled: false,
    };

    let resolveSettings: (value: ExtensionSettings | null) => void;
    const settingsPromise = new Promise<ExtensionSettings | null>((resolve) => {
      resolveSettings = resolve;
    });

    mockGetSettings.mockReturnValue(settingsPromise);
    mockIsSettingsComplete.mockReturnValue(true);

    render(
      <SettingsRequired>
        <TestComponent />
      </SettingsRequired>
    );

    // Initially should show loading UI
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();

    // Resolve the settings
    resolveSettings!(completeSettings);

    await waitFor(() => {
      expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
    });

    // Now the TestComponent should be rendered and show the context values
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('is-complete')).toHaveTextContent('true');
    expect(screen.getByTestId('settings')).toHaveTextContent(
      'https://test.cybozu.com'
    );
  });
});
