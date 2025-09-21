import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { RecordItem } from './RecordItem';

describe('RecordItem', () => {
  const createMockRecord = (
    overrides: Partial<kintone.types.SavedFields> = {}
  ): kintone.types.SavedFields => ({
    $id: { type: 'RECORD_NUMBER', value: '1' },
    $revision: { type: 'REVISION', value: '1' },
    更新者: {
      type: 'MODIFIER',
      value: { code: 'user1', name: 'User 1' },
    },
    作成者: {
      type: 'CREATOR',
      value: { code: 'user1', name: 'User 1' },
    },
    レコード番号: { type: 'RECORD_NUMBER', value: '1' },
    更新日時: { type: 'UPDATED_TIME', value: '2025-01-01T00:00:00Z' },
    作成日時: { type: 'CREATED_TIME', value: '2025-01-01T00:00:00Z' },
    name: { type: 'SINGLE_LINE_TEXT', value: 'Test Service' },
    url: { type: 'SINGLE_LINE_TEXT', value: 'https://example.com' },
    username: { type: 'SINGLE_LINE_TEXT', value: 'testuser' },
    password: { type: 'SINGLE_LINE_TEXT', value: 'testpass' },
    otpuri: {
      type: 'SINGLE_LINE_TEXT',
      value: 'otpauth://totp/Test:test@example.com?secret=JBSWY3DPEHPK3PXP',
    },
    shareto: { type: 'USER_SELECT', value: [] },
    ...overrides,
  });

  describe('レコード表示', () => {
    it('すべてのフィールドが存在する場合、正常に表示される', () => {
      const record = createMockRecord();
      render(<RecordItem record={record} />);

      expect(screen.getByText('Test Service')).toBeInTheDocument();
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
      expect(screen.getByText('ユーザー名')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('パスワード')).toBeInTheDocument();
      expect(screen.getByText('ワンタイムパスワード')).toBeInTheDocument();
    });

    it('一部のフィールドが空文字列の場合でも正常に表示される', () => {
      const record = createMockRecord({
        username: { type: 'SINGLE_LINE_TEXT', value: '' },
        password: { type: 'SINGLE_LINE_TEXT', value: '' },
        otpuri: { type: 'SINGLE_LINE_TEXT', value: '' },
      });

      render(<RecordItem record={record} />);

      expect(screen.getByText('Test Service')).toBeInTheDocument();
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
      expect(screen.queryByText('ユーザー名')).not.toBeInTheDocument();
      expect(screen.queryByText('パスワード')).not.toBeInTheDocument();
      expect(
        screen.queryByText('ワンタイムパスワード')
      ).not.toBeInTheDocument();
    });

    it('URLフィールドがundefinedの場合でもクラッシュせずに表示される', () => {
      const record = createMockRecord({
        url: undefined as any,
      });

      expect(() => render(<RecordItem record={record} />)).not.toThrow();
      expect(screen.getByText('Test Service')).toBeInTheDocument();
    });

    it('名前フィールドがundefinedの場合でもクラッシュせずに表示される', () => {
      const record = createMockRecord({
        name: undefined as any,
      });

      expect(() => render(<RecordItem record={record} />)).not.toThrow();
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
    });

    it('すべてのオプショナルフィールドがundefinedの場合でもクラッシュせずに表示される', () => {
      const record = createMockRecord({
        name: undefined as any,
        url: undefined as any,
        username: undefined as any,
        password: undefined as any,
        otpuri: undefined as any,
      });

      expect(() => render(<RecordItem record={record} />)).not.toThrow();
    });
  });

  describe('URLの表示', () => {
    it('有効なURLの場合はリンクとして表示される', () => {
      const record = createMockRecord({
        url: { type: 'SINGLE_LINE_TEXT', value: 'https://example.com' },
      });

      render(<RecordItem record={record} />);

      const link = screen.getByRole('link', { name: 'https://example.com' });
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('無効なURLの場合はテキストとして表示される', () => {
      const record = createMockRecord({
        url: { type: 'SINGLE_LINE_TEXT', value: 'not-a-url' },
      });

      render(<RecordItem record={record} />);

      expect(screen.getByText('not-a-url')).toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: 'not-a-url' })
      ).not.toBeInTheDocument();
    });
  });
});
