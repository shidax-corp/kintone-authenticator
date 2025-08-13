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
  
  try {
    new URL(url.replace(/\*/g, 'example'));
    return true;
  } catch {
    return /^https?:\/\/[^\s/$.?#].[^\s]*$/.test(url);
  }
};

export const validateFormData = (formData: FormData): FormErrors => {
  const errors: FormErrors = {};

  if (!formData.name.trim()) {
    errors.name = 'サイト名は必須です';
  }

  if (!formData.url.trim()) {
    errors.url = 'URLは必須です';
  } else if (!validateUrl(formData.url)) {
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