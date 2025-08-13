import { isOTPAuthURI } from '@lib/qr-reader';

export interface FormData {
  name: string;
  url: string;
  username: string;
  password: string;
  otpuri: string;
}

export interface FormErrors {
  name?: string;
  url?: string;
  username?: string;
  password?: string;
  otpuri?: string;
}

export const validateUrl = (url: string): boolean => {
  if (!url.trim()) return false;
  
  let testUrl = url.trim();
  
  // プロトコルがない場合はhttps://を追加
  if (!testUrl.match(/^https?:\/\//)) {
    testUrl = 'https://' + testUrl;
  }
  
  try {
    // ワイルドカードを有効なホスト名に置き換えてバリデーション
    const urlWithoutWildcard = testUrl.replace(/\*/g, 'wildcard');
    new URL(urlWithoutWildcard);
    return true;
  } catch {
    // fallbackで正規表現チェック（ワイルドカード対応）
    return /^https?:\/\/[\w\-*]+(\.[\w\-*]+)*(\:[0-9]+)?(\/.*)?$/.test(testUrl);
  }
};

export const validateFormData = (formData: FormData): FormErrors => {
  const errors: FormErrors = {};

  if (!formData.name.trim()) {
    errors.name = 'サイト名は必須です';
  }

  if (formData.url.trim() && !validateUrl(formData.url)) {
    errors.url = '有効なURLを入力してください';
  }

  if (formData.otpuri && !isOTPAuthURI(formData.otpuri)) {
    errors.otpuri = '有効なOTPAuth URIを入力してください';
  }

  return errors;
};

export const validateKintoneRecord = (record: kintone.types.Fields | kintone.types.SavedFields): FormErrors => {
  const formData: FormData = {
    name: record.name.value || '',
    url: record.url.value || '',
    username: record.username.value || '',
    password: record.password.value || '',
    otpuri: record.otpuri.value || ''
  };

  return validateFormData(formData);
};