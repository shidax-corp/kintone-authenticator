import React from 'react';

import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import SettingsRequired from './SettingsRequired';
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
