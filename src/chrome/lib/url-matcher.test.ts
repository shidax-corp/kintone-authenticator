import {
  escapeRegex,
  getBestMatch,
  getFieldType,
  getMatchingRecords,
  isInputField,
  matchURL,
  normalizeURL,
  sortRecordsByPriority,
  wildcardToRegex,
} from './url-matcher';

describe('url-matcher', () => {
  const mockRecords: kintone.types.SavedFields[] = [
    {
      $id: { value: '1' },
      $revision: { value: '1' },
      更新者: { value: { code: 'user', name: 'User' } },
      作成者: { value: { code: 'user', name: 'User' } },
      レコード番号: { value: '1' },
      更新日時: { value: '2023-01-01T00:00:00Z' },
      作成日時: { value: '2023-01-01T00:00:00Z' },
      name: { value: 'Specific Site' },
      url: { value: 'https://example.com/login' },
      username: { value: 'user1' },
      password: { value: 'pass1' },
      otpuri: { value: 'uri1' },
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
      name: { value: 'Wildcard Site' },
      url: { value: 'https://example.com/*' },
      username: { value: 'user2' },
      password: { value: 'pass2' },
      otpuri: { value: 'uri2' },
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
      name: { value: 'Another Site' },
      url: { value: 'https://another.com/*' },
      username: { value: 'user3' },
      password: { value: 'pass3' },
      otpuri: { value: 'uri3' },
      shareto: { value: [] },
    },
  ];

  describe('escapeRegex', () => {
    it('should escape special regex characters', () => {
      expect(escapeRegex('.*+?^${}()|[]\\')).toBe(
        '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\'
      );
    });

    it('should not escape normal characters', () => {
      expect(escapeRegex('abc123')).toBe('abc123');
    });
  });

  describe('wildcardToRegex', () => {
    it('should convert wildcard to regex', () => {
      const regex = wildcardToRegex('https://example.com/*');
      expect(regex.test('https://example.com/login')).toBe(true);
      expect(regex.test('https://example.com/signup')).toBe(true);
      expect(regex.test('https://other.com/login')).toBe(false);
    });

    it('should handle exact matches without wildcards', () => {
      const regex = wildcardToRegex('https://example.com/login');
      expect(regex.test('https://example.com/login')).toBe(true);
      expect(regex.test('https://example.com/signup')).toBe(false);
    });

    it('should be case insensitive', () => {
      const regex = wildcardToRegex('https://EXAMPLE.com/*');
      expect(regex.test('https://example.com/login')).toBe(true);
    });
  });

  describe('matchURL', () => {
    it('should match URLs with wildcards', () => {
      expect(
        matchURL('https://example.com/login', 'https://example.com/*')
      ).toBe(true);
      expect(matchURL('https://example.com/login', 'https://other.com/*')).toBe(
        false
      );
    });

    it('should match exact URLs', () => {
      expect(
        matchURL('https://example.com/login', 'https://example.com/login')
      ).toBe(true);
      expect(
        matchURL('https://example.com/signup', 'https://example.com/login')
      ).toBe(false);
    });

    it('should handle invalid patterns gracefully', () => {
      expect(matchURL('https://example.com', '[invalid')).toBe(false);
    });
  });

  describe('getMatchingRecords', () => {
    it('should return records that match the URL', () => {
      const matches = getMatchingRecords(
        mockRecords,
        'https://example.com/login'
      );
      expect(matches).toHaveLength(2);
      expect(matches.map((r) => r.$id.value)).toEqual(['1', '2']);
    });

    it('should return empty array for no matches', () => {
      const matches = getMatchingRecords(mockRecords, 'https://nomatch.com');
      expect(matches).toHaveLength(0);
    });
  });

  describe('sortRecordsByPriority', () => {
    it('should prioritize longer URLs', () => {
      const sorted = sortRecordsByPriority(
        mockRecords,
        'https://example.com/login'
      );
      expect(sorted[0].$id.value).toBe('1'); // Specific URL comes first
      expect(sorted[1].$id.value).toBe('2'); // Wildcard URL comes second
    });

    it('should prioritize newer records when URLs have same length', () => {
      const sameLength: kintone.types.SavedFields[] = [
        {
          $id: { value: '1' },
          $revision: { value: '1' },
          更新者: { value: { code: 'user', name: 'User' } },
          作成者: { value: { code: 'user', name: 'User' } },
          レコード番号: { value: '1' },
          更新日時: { value: '2023-01-01T00:00:00Z' },
          作成日時: { value: '2023-01-01T00:00:00Z' },
          name: { value: 'Test 1' },
          url: { value: 'https://example.com/app*' },
          username: { value: 'user1' },
          password: { value: 'pass1' },
          otpuri: { value: 'uri1' },
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
          name: { value: 'Test 2' },
          url: { value: 'https://example.com/web*' },
          username: { value: 'user2' },
          password: { value: 'pass2' },
          otpuri: { value: 'uri2' },
          shareto: { value: [] },
        },
      ];

      const sorted = sortRecordsByPriority(
        sameLength,
        'https://example.com/app1'
      );
      expect(sorted).toHaveLength(1);
      expect(sorted[0].$id.value).toBe('1');
    });

    it('should prioritize newer records when both URLs match and have same length', () => {
      const sameLength: kintone.types.SavedFields[] = [
        {
          $id: { value: '1' },
          $revision: { value: '1' },
          更新者: { value: { code: 'user', name: 'User' } },
          作成者: { value: { code: 'user', name: 'User' } },
          レコード番号: { value: '1' },
          更新日時: { value: '2023-01-01T00:00:00Z' },
          作成日時: { value: '2023-01-01T00:00:00Z' },
          name: { value: 'Test 1' },
          url: { value: 'https://site.com/*' }, // 同じ長さで両方ともマッチ
          username: { value: 'user1' },
          password: { value: 'pass1' },
          otpuri: { value: 'uri1' },
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
          name: { value: 'Test 2' },
          url: { value: 'https://site.com/*' }, // 同じ長さで両方ともマッチ
          username: { value: 'user2' },
          password: { value: 'pass2' },
          otpuri: { value: 'uri2' },
          shareto: { value: [] },
        },
      ];

      const sorted = sortRecordsByPriority(
        sameLength,
        'https://site.com/login'
      );
      expect(sorted).toHaveLength(2);
      // 新しいレコード（$id: '2'）が最初に来るべき
      expect(sorted[0].$id.value).toBe('2');
      expect(sorted[1].$id.value).toBe('1');
    });
  });

  describe('getBestMatch', () => {
    it('should return the best matching record', () => {
      const best = getBestMatch(mockRecords, 'https://example.com/login');
      expect(best?.$id.value).toBe('1');
    });

    it('should return null for no matches', () => {
      const best = getBestMatch(mockRecords, 'https://nomatch.com');
      expect(best).toBeNull();
    });
  });

  describe('normalizeURL', () => {
    it('should normalize valid URLs', () => {
      expect(normalizeURL('https://example.com/path?query=1#hash')).toBe(
        'https://example.com/path'
      );
    });

    it('should handle URLs without paths', () => {
      expect(normalizeURL('https://example.com')).toBe('https://example.com/');
    });

    it('should return original string for invalid URLs', () => {
      expect(normalizeURL('not-a-url')).toBe('not-a-url');
    });
  });

  describe('isInputField', () => {
    it('should identify input elements', () => {
      const input = document.createElement('input');
      input.type = 'text';
      expect(isInputField(input)).toBe(true);

      input.type = 'password';
      expect(isInputField(input)).toBe(true);

      input.type = 'email';
      expect(isInputField(input)).toBe(true);

      input.type = 'button';
      expect(isInputField(input)).toBe(false);
    });

    it('should identify textarea elements', () => {
      const textarea = document.createElement('textarea');
      expect(isInputField(textarea)).toBe(true);
    });

    it('should identify contentEditable elements', () => {
      const div = document.createElement('div');

      // JSDOMではisContentEditableがサポートされていないため、モック
      Object.defineProperty(div, 'isContentEditable', {
        get: function () {
          return this.contentEditable === 'true';
        },
        configurable: true,
      });

      div.contentEditable = 'true';
      expect(div.isContentEditable).toBe(true);
      expect(isInputField(div)).toBe(true);

      div.contentEditable = 'false';
      expect(div.isContentEditable).toBe(false);
      expect(isInputField(div)).toBe(false);
    });
  });

  describe('getFieldType', () => {
    it('should identify password fields', () => {
      const input = document.createElement('input');
      input.type = 'password';
      expect(getFieldType(input)).toBe('password');
    });

    it('should identify email fields', () => {
      const input = document.createElement('input');
      input.type = 'email';
      expect(getFieldType(input)).toBe('email');

      input.type = 'text';
      input.name = 'email';
      expect(getFieldType(input)).toBe('email');

      input.name = '';
      input.id = 'user-email';
      expect(getFieldType(input)).toBe('email');
    });

    it('should identify username fields', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.name = 'username';
      expect(getFieldType(input)).toBe('username');

      input.name = 'login';
      expect(getFieldType(input)).toBe('username');

      input.name = '';
      input.id = 'user-login';
      expect(getFieldType(input)).toBe('username');
    });

    it('should return text for other input types', () => {
      const input = document.createElement('input');
      input.type = 'text';
      expect(getFieldType(input)).toBe('text');
    });

    it('should return null for non-input elements', () => {
      const div = document.createElement('div');
      expect(getFieldType(div)).toBeNull();
    });
  });
});
