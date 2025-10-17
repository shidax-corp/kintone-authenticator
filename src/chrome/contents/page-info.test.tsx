import '@testing-library/jest-dom';

import { getPageSiteName } from './page-info';

// DOMをクリアしてテスト環境をリセットする関数
const clearDOM = () => {
  document.head.innerHTML = '';
  document.title = '';
};

describe('getPageSiteName', () => {
  beforeEach(() => {
    clearDOM();
  });

  afterEach(() => {
    clearDOM();
  });

  it('should return og:site_name from property attribute when available', () => {
    // og:site_nameメタタグ（property属性）を設定
    const metaTag = document.createElement('meta');
    metaTag.setAttribute('property', 'og:site_name');
    metaTag.setAttribute('content', 'GitHub');
    document.head.appendChild(metaTag);

    // document.titleも設定
    document.title = 'GitHub - Sign in to your account';

    expect(getPageSiteName()).toBe('GitHub');
  });

  it('should return og:site_name from name attribute when property attribute is not available', () => {
    // og:site_nameメタタグ（name属性）を設定
    const metaTag = document.createElement('meta');
    metaTag.setAttribute('name', 'og:site_name');
    metaTag.setAttribute('content', 'Facebook');
    document.head.appendChild(metaTag);

    // document.titleも設定
    document.title = 'Facebook - log in or sign up';

    expect(getPageSiteName()).toBe('Facebook');
  });

  it('should prioritize property attribute over name attribute when both exist', () => {
    // property属性を持つog:site_nameメタタグ
    const metaTagProperty = document.createElement('meta');
    metaTagProperty.setAttribute('property', 'og:site_name');
    metaTagProperty.setAttribute('content', 'Property Site');
    document.head.appendChild(metaTagProperty);

    // name属性を持つog:site_nameメタタグ
    const metaTagName = document.createElement('meta');
    metaTagName.setAttribute('name', 'og:site_name');
    metaTagName.setAttribute('content', 'Name Site');
    document.head.appendChild(metaTagName);

    // document.titleも設定
    document.title = 'Some Page Title';

    expect(getPageSiteName()).toBe('Property Site');
  });

  it('should return document.title when no og:site_name meta tag exists', () => {
    // og:site_nameメタタグを設定しない
    document.title = 'Example Page Title';

    expect(getPageSiteName()).toBe('Example Page Title');
  });

  it('should return empty string when no og:site_name and no document.title', () => {
    // 何も設定しない
    expect(getPageSiteName()).toBe('');
  });

  it('should trim whitespace from og:site_name content', () => {
    // 前後にスペースがあるog:site_nameメタタグ
    const metaTag = document.createElement('meta');
    metaTag.setAttribute('property', 'og:site_name');
    metaTag.setAttribute('content', '  Trimmed Site  ');
    document.head.appendChild(metaTag);

    expect(getPageSiteName()).toBe('Trimmed Site');
  });

  it('should handle empty og:site_name content and fallback to document.title', () => {
    // 空のog:site_nameメタタグ
    const metaTag = document.createElement('meta');
    metaTag.setAttribute('property', 'og:site_name');
    metaTag.setAttribute('content', '');
    document.head.appendChild(metaTag);

    document.title = 'Fallback Title';

    expect(getPageSiteName()).toBe('Fallback Title');
  });

  it('should handle og:site_name content with only whitespace and fallback to document.title', () => {
    // スペースのみのog:site_nameメタタグ
    const metaTag = document.createElement('meta');
    metaTag.setAttribute('property', 'og:site_name');
    metaTag.setAttribute('content', '   ');
    document.head.appendChild(metaTag);

    document.title = 'Fallback Title';

    expect(getPageSiteName()).toBe('Fallback Title');
  });

  it('should work with real-world OpenGraph meta tags structure', () => {
    // 実際のサイトで使われるような構造
    const ogTitle = document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    ogTitle.setAttribute('content', 'Specific Page Title');
    document.head.appendChild(ogTitle);

    const ogSiteName = document.createElement('meta');
    ogSiteName.setAttribute('property', 'og:site_name');
    ogSiteName.setAttribute('content', 'My Website');
    document.head.appendChild(ogSiteName);

    const ogDescription = document.createElement('meta');
    ogDescription.setAttribute('property', 'og:description');
    ogDescription.setAttribute('content', 'Page description');
    document.head.appendChild(ogDescription);

    document.title = 'Specific Page Title - My Website';

    expect(getPageSiteName()).toBe('My Website');
  });
});
