import { initSettings } from './settings.js';

describe('initSettings persistence', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="theme-select">
        <option value="system">system</option>
        <option value="light">light</option>
        <option value="dark">dark</option>
      </select>
      <select id="font-size-select">
        <option value="small">small</option>
        <option value="default">default</option>
        <option value="large">large</option>
      </select>
      <select id="language-select">
        <option value="system">system</option>
        <option value="en">en</option>
        <option value="ko">ko</option>
      </select>
    `;
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-font-size');
    chrome.storage.local.get.mockReset();
    chrome.storage.local.set.mockReset();
  });

  it('restores saved theme, font size, and language from storage', () => {
    chrome.storage.local.get.mockImplementation((keys, cb) => {
      cb({ theme: 'dark', fontSize: 'large', language: 'ko' });
    });

    initSettings();

    expect(document.getElementById('theme-select').value).toBe('dark');
    expect(document.getElementById('font-size-select').value).toBe('large');
    expect(document.getElementById('language-select').value).toBe('ko');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-font-size')).toBe('large');
  });

  it('persists language with a reload callback so i18n can reinitialize', () => {
    chrome.storage.local.get.mockImplementation((keys, cb) => cb({}));

    initSettings();
    const languageSelect = document.getElementById('language-select');
    languageSelect.value = 'ko';
    languageSelect.dispatchEvent(new Event('change'));

    expect(chrome.storage.local.set).toHaveBeenCalledWith({ language: 'ko' }, expect.any(Function));
  });

  it('applies theme immediately without a reload callback', () => {
    chrome.storage.local.get.mockImplementation((keys, cb) => cb({ theme: 'light' }));

    initSettings();
    const themeSelect = document.getElementById('theme-select');
    themeSelect.value = 'dark';
    themeSelect.dispatchEvent(new Event('change'));

    expect(chrome.storage.local.set).toHaveBeenCalledWith({ theme: 'dark' });
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(chrome.storage.local.set.mock.calls[0][1]).toBeUndefined();
  });
});
