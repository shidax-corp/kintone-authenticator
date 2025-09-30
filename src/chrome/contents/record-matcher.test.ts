import { getBestMatch, sortRecordsByPriority } from './record-matcher';

describe('record-matcher', () => {
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
});
