import { decrypt, isEncrypted } from '@lib/crypto';
import { PassphraseManager } from './passphrase-manager';

export interface DecryptedRecordData {
  username: string;
  password: string;
  otpuri: string;
  isDecrypted: boolean;
  hasPassphrase: boolean;
}

export async function decryptRecordData(record: kintone.types.SavedFields): Promise<DecryptedRecordData> {
  const passphrase = PassphraseManager.get();
  const hasPassphrase = passphrase !== null;
  
  // パスフレーズが設定されていない場合
  if (!hasPassphrase) {
    return {
      username: record.username.value,
      password: '',
      otpuri: '',
      isDecrypted: false,
      hasPassphrase: false,
    };
  }

  try {
    let password = record.password.value;
    let otpuri = record.otpuri.value;

    // 暗号化されている場合は復号
    if (password && isEncrypted(password)) {
      password = await decrypt(password, passphrase);
    }

    if (otpuri && isEncrypted(otpuri)) {
      otpuri = await decrypt(otpuri, passphrase);
    }

    return {
      username: record.username.value,
      password,
      otpuri,
      isDecrypted: true,
      hasPassphrase: true,
    };
  } catch (error) {
    // 復号に失敗した場合はパスフレーズを削除
    PassphraseManager.remove();
    
    return {
      username: record.username.value,
      password: '',
      otpuri: '',
      isDecrypted: false,
      hasPassphrase: false,
    };
  }
}