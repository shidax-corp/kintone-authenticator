import { getFieldType, isInputField, normalizeURL } from './form-utils';

describe('form-utils', () => {
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
