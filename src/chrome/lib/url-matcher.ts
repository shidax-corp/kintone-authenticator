import type { KintoneRecord } from './types';

export const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const wildcardToRegex = (pattern: string): RegExp => {
  const escaped = escapeRegex(pattern);
  const withWildcards = escaped.replace(/\\\*/g, '.*');
  return new RegExp(`^${withWildcards}$`, 'i');
};

export const matchURL = (url: string, pattern: string): boolean => {
  try {
    const regex = wildcardToRegex(pattern);
    return regex.test(url);
  } catch {
    return false;
  }
};

export const getMatchingRecords = (records: KintoneRecord[], url: string): KintoneRecord[] => {
  return records.filter(record => matchURL(url, record.url));
};

export const sortRecordsByPriority = (records: KintoneRecord[], url: string): KintoneRecord[] => {
  return records
    .filter(record => matchURL(url, record.url))
    .sort((a, b) => {
      const lengthA = a.url.length;
      const lengthB = b.url.length;
      
      if (lengthA !== lengthB) {
        return lengthB - lengthA;
      }
      
      const timeA = new Date(a.updatedTime).getTime();
      const timeB = new Date(b.updatedTime).getTime();
      return timeB - timeA;
    });
};

export const getBestMatch = (records: KintoneRecord[], url: string): KintoneRecord | null => {
  const sortedRecords = sortRecordsByPriority(records, url);
  return sortedRecords[0] || null;
};

export const normalizeURL = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
  } catch {
    return url;
  }
};

export const isInputField = (element: HTMLElement): boolean => {
  if (element instanceof HTMLInputElement) {
    const type = element.type.toLowerCase();
    return ['text', 'email', 'password', 'username'].includes(type);
  }
  
  if (element instanceof HTMLTextAreaElement) {
    return true;
  }
  
  return element.isContentEditable;
};

export const getFieldType = (element: HTMLElement): 'username' | 'password' | 'email' | 'text' | null => {
  if (element instanceof HTMLInputElement) {
    const type = element.type.toLowerCase();
    const name = element.name.toLowerCase();
    const id = element.id.toLowerCase();
    const placeholder = element.placeholder.toLowerCase();
    
    if (type === 'password') {
      return 'password';
    }
    
    if (type === 'email' || 
        name.includes('email') || 
        id.includes('email') || 
        placeholder.includes('email')) {
      return 'email';
    }
    
    if (name.includes('user') || 
        name.includes('login') || 
        id.includes('user') || 
        id.includes('login') || 
        placeholder.includes('user') || 
        placeholder.includes('login')) {
      return 'username';
    }
    
    return 'text';
  }
  
  return null;
};