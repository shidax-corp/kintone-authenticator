import { getBestMatch } from './record-matcher';

describe('getBestMatch', () => {
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

  it('should return the best matching record', () => {
    const best = getBestMatch(mockRecords, 'https://example.com/login');
    expect(best?.$id.value).toBe('1');
  });

  it('should return null for no matches', () => {
    const best = getBestMatch(mockRecords, 'https://nomatch.com');
    expect(best).toBeNull();
  });

  it('should prioritize longer URLs', () => {
    const best = getBestMatch(mockRecords, 'https://example.com/login');
    // Specific URL (id: 1) should be selected over wildcard URL (id: 2)
    expect(best?.$id.value).toBe('1');
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
        url: { value: 'https://site.com/*' },
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
        url: { value: 'https://site.com/*' },
        username: { value: 'user2' },
        password: { value: 'pass2' },
        otpuri: { value: 'uri2' },
        shareto: { value: [] },
      },
    ];

    const best = getBestMatch(sameLength, 'https://site.com/login');
    // 新しいレコード（$id: '2'）が選ばれるべき
    expect(best?.$id.value).toBe('2');
  });
});
