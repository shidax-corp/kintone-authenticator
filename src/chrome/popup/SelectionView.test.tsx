import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { SelectionView } from './SelectionView';

// Mock chrome runtime
const mockChrome = {
  runtime: {
    sendMessage: jest.fn(),
    openOptionsPage: jest.fn(),
  },
};

// @ts-expect-error - Mock chrome API not available in test environment
global.chrome = mockChrome;

describe('SelectionView - URL and Name Matching', () => {
  const mockRecords: kintone.types.SavedFields[] = [
    {
      $id: { value: '1' },
      $revision: { value: '1' },
      更新者: { value: { code: 'user', name: 'User' } },
      作成者: { value: { code: 'user', name: 'User' } },
      レコード番号: { value: '1' },
      更新日時: { value: '2023-01-01T00:00:00Z' },
      作成日時: { value: '2023-01-01T00:00:00Z' },
      name: { value: 'GitHub Main' },
      url: { value: 'https://github.com/login' },
      username: { value: 'user1' },
      password: { value: 'pass1' },
      otpuri: {
        value:
          'otpauth://totp/GitHub:user1?secret=JBSWY3DPEHPK3PXP&issuer=GitHub',
      },
      shareto: { value: [] },
    },
    {
      $id: { value: '2' },
      $revision: { value: '1' },
      更新者: { value: { code: 'user', name: 'User' } },
      作成者: { value: { code: 'user', name: 'User' } },
      レコード番号: { value: '2' },
      更新日時: { value: '2023-01-02T00:00:00Z' },
      作成日時: { value: '2023-01-02T00:00:00Z' },
      name: { value: 'GitHub Wildcard' },
      url: { value: 'https://github.com/*' },
      username: { value: 'user2' },
      password: { value: 'pass2' },
      otpuri: {
        value:
          'otpauth://totp/GitHub:user2?secret=GEZDGNBVGY3TQOJQ&issuer=GitHub',
      },
      shareto: { value: [] },
    },
    {
      $id: { value: '3' },
      $revision: { value: '1' },
      更新者: { value: { code: 'user', name: 'User' } },
      作成者: { value: { code: 'user', name: 'User' } },
      レコード番号: { value: '3' },
      更新日時: { value: '2023-01-03T00:00:00Z' },
      作成日時: { value: '2023-01-03T00:00:00Z' },
      name: { value: 'Example Site' },
      url: { value: 'https://example.com/login' },
      username: { value: 'user3' },
      password: { value: 'pass3' },
      otpuri: {
        value:
          'otpauth://totp/Example:user3?secret=MFRGGZDFMZTWQ2LK&issuer=Example',
      },
      shareto: { value: [] },
    },
    {
      $id: { value: '4' },
      $revision: { value: '1' },
      更新者: { value: { code: 'user', name: 'User' } },
      作成者: { value: { code: 'user', name: 'User' } },
      レコード番号: { value: '4' },
      更新日時: { value: '2023-01-04T00:00:00Z' },
      作成日時: { value: '2023-01-04T00:00:00Z' },
      name: { value: 'Test Service' },
      url: { value: 'https://test.service.com/*' },
      username: { value: 'user4' },
      password: { value: 'pass4' },
      otpuri: {
        value:
          'otpauth://totp/TestService:user4?secret=NNXWGZDBOQYTOMZR&issuer=TestService',
      },
      shareto: { value: [] },
    },
    {
      $id: { value: '5' },
      $revision: { value: '1' },
      更新者: { value: { code: 'user', name: 'User' } },
      作成者: { value: { code: 'user', name: 'User' } },
      レコード番号: { value: '5' },
      更新日時: { value: '2023-01-05T00:00:00Z' },
      作成日時: { value: '2023-01-05T00:00:00Z' },
      name: { value: 'Kintone App' },
      url: { value: 'https://subdomain.cybozu.com/k/*' },
      username: { value: 'user5' },
      password: { value: 'pass5' },
      otpuri: {
        value:
          'otpauth://totp/Kintone:user5?secret=OVZWK4RMEBRW633E&issuer=Kintone',
      },
      shareto: { value: [] },
    },
  ];

  const mockSettings = {
    kintoneBaseUrl: 'https://test.cybozu.com',
    kintoneAppId: '1',
    kintoneUsername: 'testuser',
    kintonePassword: 'testpass',
    autoFillEnabled: true,
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
          data: { otp: '123456', remainingTime: 25 },
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
      ...props,
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
      const searchInput = screen.getByPlaceholderText('名前またはURLで検索');
      fireEvent.change(searchInput, {
        target: { value: 'https://github.com/api' },
      });

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
      const searchInput = screen.getByPlaceholderText('名前またはURLで検索');
      fireEvent.change(searchInput, {
        target: { value: 'https://subdomain.cybozu.com/k/app' },
      });

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
      const searchInput = screen.getByPlaceholderText('名前またはURLで検索');
      fireEvent.change(searchInput, {
        target: { value: 'https://github.com/login' },
      });

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
      const searchInput = screen.getByPlaceholderText('名前またはURLで検索');
      fireEvent.change(searchInput, {
        target: { value: 'HTTPS://GITHUB.COM/API' },
      });

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
      const searchInput = screen.getByPlaceholderText('名前またはURLで検索');
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
      const searchInput = screen.getByPlaceholderText('名前またはURLで検索');
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
      const searchInput = screen.getByPlaceholderText('名前またはURLで検索');
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
      const searchInput = screen.getByPlaceholderText('名前またはURLで検索');
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
      const searchInput = screen.getByPlaceholderText('名前またはURLで検索');
      fireEvent.change(searchInput, {
        target: { value: 'https://github.com/api wildcard' },
      });

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
          $id: { value: '6' },
          $revision: { value: '1' },
          更新者: { value: { code: 'user', name: 'User' } },
          作成者: { value: { code: 'user', name: 'User' } },
          レコード番号: { value: '6' },
          更新日時: { value: '2023-01-06T00:00:00Z' },
          作成日時: { value: '2023-01-06T00:00:00Z' },
          name: { value: 'Example Wildcard' },
          url: { value: '*.example.com' },
          username: { value: 'user6' },
          password: { value: 'pass6' },
          otpuri: {
            value:
              'otpauth://totp/Example:user6?secret=PJWXQZLDNBSWY3DP&issuer=Example',
          },
          shareto: { value: [] },
        },
      ];

      renderSelectionView({
        initialRecords: recordsWithDomainWildcard,
        allRecords: recordsWithDomainWildcard,
      });

      await waitFor(() => {
        expect(screen.getByText('Example Wildcard')).toBeInTheDocument();
      });

      // Search with subdomain that should match *.example.com
      const searchInput = screen.getByPlaceholderText('名前またはURLで検索');
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
      const searchInput = screen.getByPlaceholderText('名前またはURLで検索');
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
      const searchInput = screen.getByPlaceholderText('名前またはURLで検索');
      fireEvent.change(searchInput, {
        target: { value: 'https://nonexistent.com/*' },
      });

      await waitFor(() => {
        // Should show no results message
        expect(
          screen.getByText('一致するものがありません')
        ).toBeInTheDocument();
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
      const searchInput = screen.getByPlaceholderText('名前またはURLで検索');
      fireEvent.change(searchInput, { target: { value: '[test.pattern' } });

      await waitFor(() => {
        // Should not crash and perform text search instead
        // This might match records that contain this text in name or URL
        const hasResults =
          screen.queryByText('一致するものがありません') !== null;
        // Should either show no results or perform safe text matching
        expect(hasResults || screen.queryByText('GitHub Main')).toBeTruthy();
      });
    });
  });

  describe('Conditional Field Rendering for Empty Values', () => {
    const mockRecordsWithEmptyFields: kintone.types.SavedFields[] = [
      {
        $id: { value: '1' },
        $revision: { value: '1' },
        更新者: { value: { code: 'user', name: 'User' } },
        作成者: { value: { code: 'user', name: 'User' } },
        レコード番号: { value: '1' },
        更新日時: { value: '2023-01-01T00:00:00Z' },
        作成日時: { value: '2023-01-01T00:00:00Z' },
        name: { value: 'Complete Record' },
        url: { value: 'https://example.com' },
        username: { value: 'user1' },
        password: { value: 'pass1' },
        otpuri: {
          value:
            'otpauth://totp/Example:user1?secret=JBSWY3DPEHPK3PXP&issuer=Example',
        },
        shareto: { value: [] },
      },
      {
        $id: { value: '2' },
        $revision: { value: '1' },
        更新者: { value: { code: 'user', name: 'User' } },
        作成者: { value: { code: 'user', name: 'User' } },
        レコード番号: { value: '2' },
        更新日時: { value: '2023-01-02T00:00:00Z' },
        作成日時: { value: '2023-01-02T00:00:00Z' },
        name: { value: 'Empty Username' },
        url: { value: 'https://example2.com' },
        username: { value: '' },
        password: { value: 'pass2' },
        otpuri: {
          value:
            'otpauth://totp/Example:pass2?secret=GEZDGNBVGY3TQOJQ&issuer=Example',
        },
        shareto: { value: [] },
      },
      {
        $id: { value: '3' },
        $revision: { value: '1' },
        更新者: { value: { code: 'user', name: 'User' } },
        作成者: { value: { code: 'user', name: 'User' } },
        レコード番号: { value: '3' },
        更新日時: { value: '2023-01-03T00:00:00Z' },
        作成日時: { value: '2023-01-03T00:00:00Z' },
        name: { value: 'Empty Password' },
        url: { value: 'https://example3.com' },
        username: { value: 'user3' },
        password: { value: '' },
        otpuri: {
          value:
            'otpauth://totp/Example:user3?secret=MFRGGZDFMZTWQ2LK&issuer=Example',
        },
        shareto: { value: [] },
      },
      {
        $id: { value: '4' },
        $revision: { value: '1' },
        更新者: { value: { code: 'user', name: 'User' } },
        作成者: { value: { code: 'user', name: 'User' } },
        レコード番号: { value: '4' },
        更新日時: { value: '2023-01-04T00:00:00Z' },
        作成日時: { value: '2023-01-04T00:00:00Z' },
        name: { value: 'Empty OTP' },
        url: { value: 'https://example4.com' },
        username: { value: 'user4' },
        password: { value: 'pass4' },
        otpuri: { value: '' },
        shareto: { value: [] },
      },
      {
        $id: { value: '5' },
        $revision: { value: '1' },
        更新者: { value: { code: 'user', name: 'User' } },
        作成者: { value: { code: 'user', name: 'User' } },
        レコード番号: { value: '5' },
        更新日時: { value: '2023-01-05T00:00:00Z' },
        作成日時: { value: '2023-01-05T00:00:00Z' },
        name: { value: 'All Empty' },
        url: { value: 'https://example5.com' },
        username: { value: '' },
        password: { value: '' },
        otpuri: { value: '' },
        shareto: { value: [] },
      },
      {
        $id: { value: '6' },
        $revision: { value: '1' },
        更新者: { value: { code: 'user', name: 'User' } },
        作成者: { value: { code: 'user', name: 'User' } },
        レコード番号: { value: '6' },
        更新日時: { value: '2023-01-06T00:00:00Z' },
        作成日時: { value: '2023-01-06T00:00:00Z' },
        name: { value: 'HOTP Record' },
        url: { value: 'https://example6.com' },
        username: { value: 'user6' },
        password: { value: 'pass6' },
        otpuri: {
          value: 'otpauth://hotp/test6?secret=ABCDEFGHIJKLMNOP&counter=1',
        },
        shareto: { value: [] },
      },
    ];

    beforeEach(() => {
      jest.clearAllMocks();

      // Mock successful responses
      mockChrome.runtime.sendMessage.mockImplementation((message) => {
        if (message.type === 'GET_SETTINGS') {
          return Promise.resolve({ success: true, data: mockSettings });
        }
        if (message.type === 'GET_RECORDS') {
          return Promise.resolve({
            success: true,
            data: mockRecordsWithEmptyFields,
          });
        }
        if (message.type === 'GET_OTP') {
          return Promise.resolve({
            success: true,
            data: { otp: '123456', remainingTime: 25 },
          });
        }
        return Promise.resolve({ success: true });
      });
    });

    it('should only render fields with non-empty values', async () => {
      render(
        <SelectionView
          onRegister={jest.fn()}
          initialRecords={mockRecordsWithEmptyFields}
          allRecords={mockRecordsWithEmptyFields}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Complete Record')).toBeInTheDocument();
      });

      // Count components by their labels - only non-empty fields should be rendered
      const usernameFields = screen.getAllByText('ユーザー名');
      const passwordFields = screen.getAllByText('パスワード');
      const otpFields = screen.getAllByText('ワンタイムパスワード');

      // Complete Record, Empty Password, Empty OTP, HOTP Record have username (4 total)
      expect(usernameFields).toHaveLength(4);

      // Complete Record, Empty Username, Empty OTP, HOTP Record have password (4 total)
      expect(passwordFields).toHaveLength(4);

      // Complete Record, Empty Username, Empty Password, HOTP Record have OTP (4 total)
      expect(otpFields).toHaveLength(4);
    });

    it('should not render username field when username is empty', async () => {
      render(
        <SelectionView
          onRegister={jest.fn()}
          initialRecords={[mockRecordsWithEmptyFields[1]]} // Empty Username record
          allRecords={[mockRecordsWithEmptyFields[1]]}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Empty Username')).toBeInTheDocument();
      });

      // Should not have username field for this record
      expect(screen.queryByText('ユーザー名')).not.toBeInTheDocument();
      // Should have password and OTP fields
      expect(screen.getByText('パスワード')).toBeInTheDocument();
      expect(screen.getByText('ワンタイムパスワード')).toBeInTheDocument();
    });

    it('should not render password field when password is empty', async () => {
      render(
        <SelectionView
          onRegister={jest.fn()}
          initialRecords={[mockRecordsWithEmptyFields[2]]} // Empty Password record
          allRecords={[mockRecordsWithEmptyFields[2]]}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Empty Password')).toBeInTheDocument();
      });

      // Should have username and OTP fields
      expect(screen.getByText('ユーザー名')).toBeInTheDocument();
      expect(screen.getByText('ワンタイムパスワード')).toBeInTheDocument();
      // Should not have password field for this record
      expect(screen.queryByText('パスワード')).not.toBeInTheDocument();
    });

    it('should not render OTP field when otpAuthUri is empty', async () => {
      render(
        <SelectionView
          onRegister={jest.fn()}
          initialRecords={[mockRecordsWithEmptyFields[3]]} // Empty OTP record
          allRecords={[mockRecordsWithEmptyFields[3]]}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Empty OTP')).toBeInTheDocument();
      });

      // Should have username and password fields
      expect(screen.getByText('ユーザー名')).toBeInTheDocument();
      expect(screen.getByText('パスワード')).toBeInTheDocument();
      // Should not have OTP field for this record
      expect(
        screen.queryByText('ワンタイムパスワード')
      ).not.toBeInTheDocument();
    });

    it('should not display records when all fields are empty', async () => {
      render(
        <SelectionView
          onRegister={jest.fn()}
          initialRecords={[mockRecordsWithEmptyFields[4]]} // All Empty record
          allRecords={[mockRecordsWithEmptyFields[4]]}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText('まだ何も登録されていません')
        ).toBeInTheDocument();
      });

      // Should not display the "All Empty" record at all
      expect(screen.queryByText('All Empty')).not.toBeInTheDocument();
      // Should not have any field components
      expect(screen.queryByText('ユーザー名')).not.toBeInTheDocument();
      expect(screen.queryByText('パスワード')).not.toBeInTheDocument();
      expect(
        screen.queryByText('ワンタイムパスワード')
      ).not.toBeInTheDocument();
    });

    it('should render OTP field for HOTP records', async () => {
      render(
        <SelectionView
          onRegister={jest.fn()}
          initialRecords={[mockRecordsWithEmptyFields[5]]} // HOTP Record
          allRecords={[mockRecordsWithEmptyFields[5]]}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('HOTP Record')).toBeInTheDocument();
      });

      // Should have all field components including OTP for HOTP record
      expect(screen.getByText('ユーザー名')).toBeInTheDocument();
      expect(screen.getByText('パスワード')).toBeInTheDocument();
      expect(screen.getByText('ワンタイムパスワード')).toBeInTheDocument();
    });

    it('should exclude all-empty records from mixed record list', async () => {
      render(
        <SelectionView
          onRegister={jest.fn()}
          initialRecords={mockRecordsWithEmptyFields}
          allRecords={mockRecordsWithEmptyFields}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Complete Record')).toBeInTheDocument();
      });

      // Should display valid records
      expect(screen.getByText('Complete Record')).toBeInTheDocument();
      expect(screen.getByText('Empty Username')).toBeInTheDocument();
      expect(screen.getByText('Empty Password')).toBeInTheDocument();
      expect(screen.getByText('Empty OTP')).toBeInTheDocument();
      expect(screen.getByText('HOTP Record')).toBeInTheDocument();

      // Should not display the "All Empty" record
      expect(screen.queryByText('All Empty')).not.toBeInTheDocument();
    });
  });
});
