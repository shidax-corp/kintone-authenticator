declare namespace kintone.types {
  interface Fields {
    otpuri: kintone.fieldTypes.SingleLineText;
    url: kintone.fieldTypes.SingleLineText;
    password: kintone.fieldTypes.SingleLineText;
    name: kintone.fieldTypes.SingleLineText;
    username: kintone.fieldTypes.SingleLineText;
  }
  interface SavedFields extends Fields {
    $id: kintone.fieldTypes.Id;
    $revision: kintone.fieldTypes.Revision;
    更新者: kintone.fieldTypes.Modifier;
    作成者: kintone.fieldTypes.Creator;
    レコード番号: kintone.fieldTypes.RecordNumber;
    更新日時: kintone.fieldTypes.UpdatedTime;
    作成日時: kintone.fieldTypes.CreatedTime;
  }
}
