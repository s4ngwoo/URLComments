import { applyTheme, applyFontSize } from './settings.js';

describe('popup/settings.js', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-font-size');
  });

  afterEach(() => {
    delete window.matchMedia;
  });

  it('applyTheme writes explicit dark and light attributes', () => {
    applyTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    applyTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('applyTheme(system) follows prefers-color-scheme', () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      addEventListener: jest.fn()
    }));
    applyTheme('system');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      addEventListener: jest.fn()
    }));
    applyTheme('system');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('applyFontSize rejects unknown sizes', () => {
    applyFontSize('huge');
    expect(document.documentElement.getAttribute('data-font-size')).toBe('default');
    applyFontSize('large');
    expect(document.documentElement.getAttribute('data-font-size')).toBe('large');
  });
});
