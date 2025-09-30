import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import useListSearcher from '../../lib/listSearcher';
import ListApp from './index';

// Mock the useListSearcher hook
jest.mock('../../lib/listSearcher', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock the useElementsAttributeSetter hook
jest.mock('../../lib/elementsAttributeSetter', () => ({
  __esModule: true,
  default: jest.fn(() => jest.fn()),
}));

// Mock SearchField component
jest.mock('@components/SearchField', () => ({
  __esModule: true,
  default: jest.fn(({ value, onChange }) => (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="SearchField Mock"
    />
  )),
}));

// Mock AccountCard component
jest.mock('./AccountCard', () => ({
  __esModule: true,
  default: jest.fn(({ account }) => (
    <li data-testid="account-card">{account.name.value}</li>
  )),
}));

// Mock kintone global
global.kintone = {
  app: {
    getQueryCondition: jest.fn(() => ''),
  },
} as any;

const mockUseListSearcher = useListSearcher as jest.MockedFunction<
  typeof useListSearcher
>;

describe('ListApp - Desktop', () => {
  const mockAppId = 1;
  const mockViewId = 1;
  const mockRecords: kintone.types.SavedFields[] = [
    {
      $id: { value: '1' },
      $revision: { value: '1' },
      更新者: { value: { code: 'user', name: 'User' } },
      作成者: { value: { code: 'user', name: 'User' } },
      レコード番号: { value: '1' },
      更新日時: { value: '2023-01-01T00:00:00Z' },
      作成日時: { value: '2023-01-01T00:00:00Z' },
      name: { value: 'Test Account 1' },
      url: { value: 'https://example.com' },
      username: { value: 'user1' },
      password: { value: 'pass1' },
      otpuri: { value: 'otpauth://totp/Test1' },
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
      name: { value: 'Test Account 2' },
      url: { value: 'https://example2.com' },
      username: { value: 'user2' },
      password: { value: 'pass2' },
      otpuri: { value: 'otpauth://totp/Test2' },
      shareto: { value: [] },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty State Messages', () => {
    it('should display "まだ何も登録されていません" when no records and no search conditions', () => {
      mockUseListSearcher.mockReturnValue({
        query: '',
        setQuery: jest.fn(),
        records: [],
        fetchedAll: false,
        message: 'まだ何も登録されていません',
      });

      render(<ListApp appId={mockAppId} viewId={mockViewId} records={[]} />);

      expect(
        screen.getByText('まだ何も登録されていません')
      ).toBeInTheDocument();
      expect(screen.queryByTestId('account-card')).not.toBeInTheDocument();
    });

    it('should display "一致するものがありません" when no matching records with search query', () => {
      mockUseListSearcher.mockReturnValue({
        query: 'NonExistent',
        setQuery: jest.fn(),
        records: [],
        fetchedAll: true,
        message: '一致するものがありません',
      });

      render(
        <ListApp appId={mockAppId} viewId={mockViewId} records={mockRecords} />
      );

      expect(screen.getByText('一致するものがありません')).toBeInTheDocument();
      expect(screen.queryByTestId('account-card')).not.toBeInTheDocument();
    });

    it('should display "一致するものがありません" when no records with kintone query condition', () => {
      global.kintone.app.getQueryCondition = jest.fn(() => 'status = "Active"');

      mockUseListSearcher.mockReturnValue({
        query: '',
        setQuery: jest.fn(),
        records: [],
        fetchedAll: false,
        message: '一致するものがありません',
      });

      render(<ListApp appId={mockAppId} viewId={mockViewId} records={[]} />);

      expect(screen.getByText('一致するものがありません')).toBeInTheDocument();
      expect(screen.queryByTestId('account-card')).not.toBeInTheDocument();
    });

    it('should not display message when records exist', () => {
      mockUseListSearcher.mockReturnValue({
        query: '',
        setQuery: jest.fn(),
        records: mockRecords,
        fetchedAll: false,
        message: '',
      });

      render(
        <ListApp appId={mockAppId} viewId={mockViewId} records={mockRecords} />
      );

      expect(
        screen.queryByText('まだ何も登録されていません')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('一致するものがありません')
      ).not.toBeInTheDocument();
      expect(screen.getAllByTestId('account-card')).toHaveLength(2);
    });

    it('should not display message when search results exist', () => {
      mockUseListSearcher.mockReturnValue({
        query: 'Test',
        setQuery: jest.fn(),
        records: [mockRecords[0]],
        fetchedAll: false,
        message: '',
      });

      render(
        <ListApp appId={mockAppId} viewId={mockViewId} records={mockRecords} />
      );

      expect(
        screen.queryByText('まだ何も登録されていません')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('一致するものがありません')
      ).not.toBeInTheDocument();
      expect(screen.getAllByTestId('account-card')).toHaveLength(1);
    });
  });

  describe('Message Styling', () => {
    it('should apply correct styles to the empty state message', () => {
      mockUseListSearcher.mockReturnValue({
        query: '',
        setQuery: jest.fn(),
        records: [],
        fetchedAll: false,
        message: 'まだ何も登録されていません',
      });

      const { container } = render(
        <ListApp appId={mockAppId} viewId={mockViewId} records={[]} />
      );

      const messageDiv =
        screen.getByText('まだ何も登録されていません').parentElement;
      expect(messageDiv).toHaveClass('message');

      // Check if styled-jsx styles are present (they should be in a style tag)
      const styleTag = container.querySelector('style');
      expect(styleTag).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should display search field and empty message together', () => {
      mockUseListSearcher.mockReturnValue({
        query: '',
        setQuery: jest.fn(),
        records: [],
        fetchedAll: false,
        message: 'まだ何も登録されていません',
      });

      render(<ListApp appId={mockAppId} viewId={mockViewId} records={[]} />);

      expect(
        screen.getByPlaceholderText('SearchField Mock')
      ).toBeInTheDocument();
      expect(
        screen.getByText('まだ何も登録されていません')
      ).toBeInTheDocument();
    });

    it('should display search field and records when available', () => {
      mockUseListSearcher.mockReturnValue({
        query: '',
        setQuery: jest.fn(),
        records: mockRecords,
        fetchedAll: false,
        message: '',
      });

      render(
        <ListApp appId={mockAppId} viewId={mockViewId} records={mockRecords} />
      );

      expect(
        screen.getByPlaceholderText('SearchField Mock')
      ).toBeInTheDocument();
      expect(screen.getAllByTestId('account-card')).toHaveLength(2);
      expect(screen.getByText('Test Account 1')).toBeInTheDocument();
      expect(screen.getByText('Test Account 2')).toBeInTheDocument();
    });
  });
});
