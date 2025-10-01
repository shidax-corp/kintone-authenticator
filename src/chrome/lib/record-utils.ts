/**
 * レコードが有効なフィールド（username/password/otpuri）を持つかどうかをチェックする。
 *
 * @param record チェックするレコード
 * @returns 有効なフィールドが1つ以上あればtrue
 */
export function hasAnyValidField(record: kintone.types.SavedFields): boolean {
  return !!(
    record.username?.value ||
    record.password?.value ||
    record.otpuri?.value
  );
}
