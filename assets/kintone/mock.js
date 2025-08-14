// ローカルでkintoneを模倣するためのプログラム

// ダミーレコードのサンプルデータを作成する関数
const createRecord = (
  id,
  revision,
  createdTime,
  updatedTime,
  recordNumber
) => ({
  $id: { type: 'RECORD_NUMBER', value: id },
  $revision: { type: '__REVISION__', value: revision },
  作成者: { type: 'CREATOR', value: { code: 'user1', name: '作成者ユーザー' } },
  更新者: {
    type: 'MODIFIER',
    value: { code: 'user1', name: '更新者ユーザー' },
  },
  作成日時: { type: 'CREATED_TIME', value: createdTime },
  更新日時: { type: 'UPDATED_TIME', value: updatedTime },
  レコード番号: { type: 'RECORD_NUMBER', value: recordNumber },
  name: { type: 'SINGLE_LINE_TEXT', value: 'GitHub' },
  url: { type: 'SINGLE_LINE_TEXT', value: 'https://github.com' },
  username: { type: 'SINGLE_LINE_TEXT', value: 'testuser@example.com' },
  password: { type: 'SINGLE_LINE_TEXT', value: '********' },
  otpuri: {
    type: 'SINGLE_LINE_TEXT',
    value:
      'otpauth://totp/GitHub:testuser@example.com?secret=JBSWY3DPEHPK3PXP&issuer=GitHub',
  },
});

// 複数のダミーレコード
const dummyRecords = [
  createRecord('1', '1', '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', '1'),
  {
    ...createRecord(
      '2',
      '2',
      '2024-01-02T00:00:00Z',
      '2024-01-02T00:00:00Z',
      '2'
    ),
    name: { type: 'SINGLE_LINE_TEXT', value: 'Google' },
    url: { type: 'SINGLE_LINE_TEXT', value: 'https://accounts.google.com' },
    username: { type: 'SINGLE_LINE_TEXT', value: 'user@gmail.com' },
    password: { type: 'SINGLE_LINE_TEXT', value: '********' },
    otpuri: {
      type: 'SINGLE_LINE_TEXT',
      value:
        'otpauth://totp/Google:user@gmail.com?secret=JBSWY3DPEHPK3PXQ&issuer=Google',
    },
  },
  {
    ...createRecord(
      '3',
      '1',
      '2024-01-03T00:00:00Z',
      '2024-01-03T00:00:00Z',
      '3'
    ),
    name: { type: 'SINGLE_LINE_TEXT', value: 'AWS' },
    url: { type: 'SINGLE_LINE_TEXT', value: 'https://console.aws.amazon.com' },
    username: { type: 'SINGLE_LINE_TEXT', value: 'aws-admin' },
    password: { type: 'SINGLE_LINE_TEXT', value: '********' },
    otpuri: {
      type: 'SINGLE_LINE_TEXT',
      value: 'otpauth://totp/AWS:aws-admin?secret=JBSWY3DPEHPK3PXR&issuer=AWS',
    },
  },
];

// 新規作成用の空のレコード
const emptyRecord = {
  name: { type: 'SINGLE_LINE_TEXT', value: '' },
  url: { type: 'SINGLE_LINE_TEXT', value: '' },
  username: { type: 'SINGLE_LINE_TEXT', value: '' },
  password: { type: 'SINGLE_LINE_TEXT', value: '' },
  otpuri: { type: 'SINGLE_LINE_TEXT', value: '' },
};

const events = {
  [['app.record.index.show', 'mobile.app.record.index.show']]: {
    appId: 1,
    viewId: '2022',
    records: dummyRecords,
  },
  [['app.record.detail.show', 'mobile.app.record.detail.show']]: {
    appId: 1,
    recordId: 1,
    record: dummyRecords[0],
  },
  [['app.record.create.show', 'mobile.app.record.create.show']]: {
    appId: 1,
    record: emptyRecord,
  },
  [['app.record.edit.show', 'mobile.app.record.edit.show']]: {
    appId: 1,
    recordId: 1,
    record: dummyRecords[0],
  },
  [['app.record.create.submit', 'mobile.app.record.create.submit']]: {
    appId: 1,
    record: emptyRecord,
  },
  [['app.record.edit.submit', 'mobile.app.record.edit.submit']]: {
    appId: 1,
    recordId: 1,
    record: dummyRecords[0],
  },
};

function createKintoneMock(allowEvents) {
  return {
    events: {
      on(event, callback) {
        window.addEventListener('load', () => {
          if (typeof event === 'string') {
            event = [event];
          }
          for (const e of event) {
            if (!allowEvents.includes(e)) {
              continue;
            }
            for (const [key, value] of Object.entries(events)) {
              if (key.includes(e)) {
                console.log(`Event triggered: ${e}`);
                callback({
                  ...value,
                  type: key,
                });
              }
            }
          }
        });
      },
    },

    app: {
      getHeaderSpaceElement() {
        return document.querySelector('.header-space');
      },

      record: {
        getFieldElement(fieldCode) {
          return document.querySelector(
            `.field[data-field-code="${fieldCode}"]`
          );
        },
        getSaceElement(spaceId) {
          return document.querySelector(`.space[data-space-id="${spaceId}"]`);
        },
        setFieldShown(fieldCode, isShown) {
          const fieldElement = this.getFieldElement(fieldCode);
          if (fieldElement) {
            fieldElement.style.display = isShown ? 'block' : 'none';
          }
        },
        get() {
          return {
            record: dummyRecords[0],
          };
        },
        set(record) {
          console.log('Record set:', record);
          return Promise.resolve();
        },
      },
    },
  };
}
