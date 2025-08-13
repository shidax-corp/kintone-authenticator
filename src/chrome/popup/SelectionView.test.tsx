import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SelectionView } from './SelectionView';
import type { KintoneRecord } from '../lib/types';

// Mock chrome runtime
const mockChrome = {
  runtime: {
    sendMessage: jest.fn(),
    openOptionsPage: jest.fn(),
  },
};

// @ts-ignore
global.chrome = mockChrome;

describe('SelectionView - URL and Name Matching', () => {
  const mockRecords: KintoneRecord[] = [
    {
      recordId: '1',
      name: 'GitHub Main',
      url: 'https://github.com/login',
      username: 'user1',
      password: 'pass1',
      otpAuthUri: 'otpauth://totp/test1',
      updatedTime: '2023-01-01T00:00:00Z'
    },
    {
      recordId: '2',
      name: 'GitHub Wildcard',
      url: 'https://github.com/*',
      username: 'user2',
      password: 'pass2',
      otpAuthUri: 'otpauth://totp/test2',
      updatedTime: '2023-01-02T00:00:00Z'
    },
    {
      recordId: '3',
      name: 'Example Site',
      url: 'https://example.com/login',
      username: 'user3',
      password: 'pass3',
      otpAuthUri: 'otpauth://totp/test3',
      updatedTime: '2023-01-03T00:00:00Z'
    },
    {
      recordId: '4',
      name: 'Test Service',
      url: 'https://test.service.com/*',
      username: 'user4',
      password: 'pass4',
      otpAuthUri: 'otpauth://totp/test4',
      updatedTime: '2023-01-04T00:00:00Z'
    },
    {
      recordId: '5',
      name: 'Kintone App',
      url: 'https://subdomain.cybozu.com/k/*',
      username: 'user5',
      password: 'pass5',
      otpAuthUri: 'otpauth://totp/test5',
      updatedTime: '2023-01-05T00:00:00Z'
    }
  ];

  const mockSettings = {
    kintoneBaseUrl: 'https://test.cybozu.com',
    kintoneUsername: 'testuser',
    kintonePassword: 'testpass',
    autoFillEnabled: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful responses
    mockChrome.runtime.sendMessage.mockImplementation((message) => {
      if (message.type === 'GET_SETTINGS') {
        return Promise.resolve({ success: true, data: mockSettings });
      }
      if (message.type === 'GET_RECORDS') {
        return Promise.resolve({ success: true, data: mockRecords });
      }
      if (message.type === 'GET_OTP') {
        return Promise.resolve({ 
          success: true, 
          data: { otp: '123456', remainingTime: 25 }
        });
      }
      return Promise.resolve({ success: true });
    });
  });

  const renderSelectionView = (props = {}) => {
    const defaultProps = {
      onRegister: jest.fn(),
      initialRecords: mockRecords,
      allRecords: mockRecords,
      ...props
    };
    
    return render(<SelectionView {...defaultProps} />);
  };

  describe('Record URL Wildcard Matching', () => {
    it('should match query against wildcard record URL', async () => {
      renderSelectionView();
      
      await waitFor(() => {
        expect(screen.getByText('GitHub Main')).toBeInTheDocument();
      });

      // Search for specific URL that matches wildcard record URL
      const searchInput = screen.getByPlaceholderText('名前やURLで検索...');
      fireEvent.change(searchInput, { target: { value: 'https://github.com/api' } });

      await waitFor(() => {
        // Should match wildcard GitHub record
        expect(screen.getByText('GitHub Wildcard')).toBeInTheDocument();
        // Should not match exact URL record (doesn't contain api.github.com)
        expect(screen.queryByText('GitHub Main')).not.toBeInTheDocument();
        expect(screen.queryByText('Example Site')).not.toBeInTheDocument();
      });
    });

    it('should match subdomain against wildcard record URL', async () => {
      renderSelectionView();
      
      await waitFor(() => {
        expect(screen.getByText('GitHub Main')).toBeInTheDocument();
      });

      // Search for subdomain that matches wildcard record
      const searchInput = screen.getByPlaceholderText('名前やURLで検索...');
      fireEvent.change(searchInput, { target: { value: 'https://subdomain.cybozu.com/k/app' } });

      await waitFor(() => {
        // Should match kintone record with wildcard URL
        expect(screen.getByText('Kintone App')).toBeInTheDocument();
        // Should not match other records
        expect(screen.queryByText('GitHub Main')).not.toBeInTheDocument();
        expect(screen.queryByText('Example Site')).not.toBeInTheDocument();
      });
    });

    it('should match exact URL with text search', async () => {
      renderSelectionView();
      
      await waitFor(() => {
        expect(screen.getByText('GitHub Main')).toBeInTheDocument();
      });

      // Search for exact URL
      const searchInput = screen.getByPlaceholderText('名前やURLで検索...');
      fireEvent.change(searchInput, { target: { value: 'https://github.com/login' } });

      await waitFor(() => {
        // Should match the exact URL record
        expect(screen.getByText('GitHub Main')).toBeInTheDocument();
        // Should also match wildcard record since query matches the pattern
        expect(screen.getByText('GitHub Wildcard')).toBeInTheDocument();
        expect(screen.queryByText('Example Site')).not.toBeInTheDocument();
      });
    });

    it('should be case insensitive for URL matching', async () => {
      renderSelectionView();
      
      await waitFor(() => {
        expect(screen.getByText('GitHub Main')).toBeInTheDocument();
      });

      // Search with different case
      const searchInput = screen.getByPlaceholderText('名前やURLで検索...');
      fireEvent.change(searchInput, { target: { value: 'HTTPS://GITHUB.COM/API' } });

      await waitFor(() => {
        // Should match wildcard GitHub record despite case difference
        expect(screen.getByText('GitHub Wildcard')).toBeInTheDocument();
        expect(screen.queryByText('GitHub Main')).not.toBeInTheDocument();
      });
    });
  });

  describe('Text-based Search', () => {
    it('should filter records using name text search', async () => {
      renderSelectionView();
      
      await waitFor(() => {
        expect(screen.getByText('GitHub Main')).toBeInTheDocument();
      });

      // Search by name
      const searchInput = screen.getByPlaceholderText('名前やURLで検索...');
      fireEvent.change(searchInput, { target: { value: 'GitHub' } });

      await waitFor(() => {
        // Should match both GitHub records
        expect(screen.getByText('GitHub Main')).toBeInTheDocument();
        expect(screen.getByText('GitHub Wildcard')).toBeInTheDocument();
        // Should not match other records
        expect(screen.queryByText('Example Site')).not.toBeInTheDocument();
      });
    });

    it('should filter records using URL text search', async () => {
      renderSelectionView();
      
      await waitFor(() => {
        expect(screen.getByText('GitHub Main')).toBeInTheDocument();
      });

      // Search by URL text (without wildcard)
      const searchInput = screen.getByPlaceholderText('名前やURLで検索...');
      fireEvent.change(searchInput, { target: { value: 'cybozu' } });

      await waitFor(() => {
        // Should match kintone record
        expect(screen.getByText('Kintone App')).toBeInTheDocument();
        // Should not match other records
        expect(screen.queryByText('GitHub Main')).not.toBeInTheDocument();
      });
    });

    it('should be case insensitive for text search', async () => {
      renderSelectionView();
      
      await waitFor(() => {
        expect(screen.getByText('GitHub Main')).toBeInTheDocument();
      });

      // Search with different case
      const searchInput = screen.getByPlaceholderText('名前やURLで検索...');
      fireEvent.change(searchInput, { target: { value: 'github' } });

      await waitFor(() => {
        // Should match both GitHub records despite case difference
        expect(screen.getByText('GitHub Main')).toBeInTheDocument();
        expect(screen.getByText('GitHub Wildcard')).toBeInTheDocument();
      });
    });
  });

  describe('Mixed Search', () => {
    it('should handle multiple search terms with wildcards', async () => {
      renderSelectionView();
      
      await waitFor(() => {
        expect(screen.getByText('GitHub Main')).toBeInTheDocument();
      });

      // Search with URL text and name text
      const searchInput = screen.getByPlaceholderText('名前やURLで検索...');
      fireEvent.change(searchInput, { target: { value: 'github main' } });

      await waitFor(() => {
        // Should match records where both terms match (either in URL or name)
        expect(screen.getByText('GitHub Main')).toBeInTheDocument();
        // Should not match GitHub Wildcard (doesn't contain "main")
        expect(screen.queryByText('GitHub Wildcard')).not.toBeInTheDocument();
      });
    });

    it('should handle wildcard URL matching with additional text terms', async () => {
      renderSelectionView();
      
      await waitFor(() => {
        expect(screen.getByText('GitHub Main')).toBeInTheDocument();
      });

      // Search with URL that matches wildcard + additional text
      const searchInput = screen.getByPlaceholderText('名前やURLで検索...');
      fireEvent.change(searchInput, { target: { value: 'https://github.com/api wildcard' } });

      await waitFor(() => {
        // Should match GitHub Wildcard (URL matches wildcard AND name contains "wildcard")
        expect(screen.getByText('GitHub Wildcard')).toBeInTheDocument();
        // Should not match other records
        expect(screen.queryByText('GitHub Main')).not.toBeInTheDocument();
        expect(screen.queryByText('Test Service')).not.toBeInTheDocument();
      });
    });
    
    it('should match domain wildcard patterns from user requirement', async () => {
      // Add a record with *.example.com pattern
      const recordsWithDomainWildcard = [
        ...mockRecords,
        {
          recordId: '6',
          name: 'Example Wildcard',
          url: '*.example.com',
          username: 'user6',
          password: 'pass6',
          otpAuthUri: 'otpauth://totp/test6',
          updatedTime: '2023-01-06T00:00:00Z'
        }
      ];
      
      renderSelectionView({ initialRecords: recordsWithDomainWildcard, allRecords: recordsWithDomainWildcard });
      
      await waitFor(() => {
        expect(screen.getByText('Example Wildcard')).toBeInTheDocument();
      });

      // Search with subdomain that should match *.example.com
      const searchInput = screen.getByPlaceholderText('名前やURLで検索...');
      fireEvent.change(searchInput, { target: { value: 'a.example.com' } });

      await waitFor(() => {
        // Should match the wildcard record
        expect(screen.getByText('Example Wildcard')).toBeInTheDocument();
        // Should not match other records
        expect(screen.queryByText('GitHub Main')).not.toBeInTheDocument();
        expect(screen.queryByText('GitHub Wildcard')).not.toBeInTheDocument();
      });
    });
  });

  describe('Empty and Invalid Search', () => {
    it('should show all records when search is empty', async () => {
      renderSelectionView();
      
      await waitFor(() => {
        expect(screen.getByText('GitHub Main')).toBeInTheDocument();
      });

      // Clear search
      const searchInput = screen.getByPlaceholderText('名前やURLで検索...');
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        // Should show all records
        expect(screen.getByText('GitHub Main')).toBeInTheDocument();
        expect(screen.getByText('GitHub Wildcard')).toBeInTheDocument();
        expect(screen.getByText('Example Site')).toBeInTheDocument();
        expect(screen.getByText('Test Service')).toBeInTheDocument();
        expect(screen.getByText('Kintone App')).toBeInTheDocument();
      });
    });

    it('should show no results message when no matches found', async () => {
      renderSelectionView();
      
      await waitFor(() => {
        expect(screen.getByText('GitHub Main')).toBeInTheDocument();
      });

      // Search for non-existent pattern
      const searchInput = screen.getByPlaceholderText('名前やURLで検索...');
      fireEvent.change(searchInput, { target: { value: 'https://nonexistent.com/*' } });

      await waitFor(() => {
        // Should show no results message
        expect(screen.getByText('検索条件に一致するレコードがありません')).toBeInTheDocument();
        // Should not show any records
        expect(screen.queryByText('GitHub Main')).not.toBeInTheDocument();
      });
    });

    it('should handle invalid regex patterns gracefully', async () => {
      renderSelectionView();
      
      await waitFor(() => {
        expect(screen.getByText('GitHub Main')).toBeInTheDocument();
      });

      // Search with text that could cause regex issues when used with wildcard URLs
      const searchInput = screen.getByPlaceholderText('名前やURLで検索...');
      fireEvent.change(searchInput, { target: { value: '[test.pattern' } });

      await waitFor(() => {
        // Should not crash and perform text search instead
        // This might match records that contain this text in name or URL
        const hasResults = screen.queryByText('検索条件に一致するレコードがありません') !== null;
        // Should either show no results or perform safe text matching
        expect(hasResults || screen.queryByText('GitHub Main')).toBeTruthy();
      });
    });
  });
});