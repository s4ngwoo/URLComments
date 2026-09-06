export function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    // system
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }
}

export function applyFontSize(fontSize) {
  const validSizes = ['small', 'default', 'large'];
  const size = validSizes.includes(fontSize) ? fontSize : 'default';
  document.documentElement.setAttribute('data-font-size', size);
}

export function initSettings() {
  const themeSelect = document.getElementById('theme-select');
  const fontSizeSelect = document.getElementById('font-size-select');
  const languageSelect = document.getElementById('language-select');

  // Load saved preferences
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['theme', 'fontSize', 'language'], (result) => {
      const theme = result.theme || 'system';
      const fontSize = result.fontSize || 'default';
      const language = result.language || 'system';

      if (themeSelect) themeSelect.value = theme;
      applyTheme(theme);

      if (fontSizeSelect) fontSizeSelect.value = fontSize;
      applyFontSize(fontSize);
      
      if (languageSelect) languageSelect.value = language;
    });
  } else {
    applyTheme('system');
    applyFontSize('default');
  }

  // Handle language change
  if (languageSelect) {
    languageSelect.addEventListener('change', (e) => {
      const language = e.target.value;
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ language }, () => {
          window.location.reload();
        });
      }
    });
  }

  // Handle theme change
  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      const theme = e.target.value;
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ theme });
      }
      applyTheme(theme);
    });
  }

  // Handle font size change
  if (fontSizeSelect) {
    fontSizeSelect.addEventListener('change', (e) => {
      const fontSize = e.target.value;
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ fontSize });
      }
      applyFontSize(fontSize);
    });
  }
}

// Listen for system theme changes if set to system
if (typeof window !== 'undefined' && window.matchMedia) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', () => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['theme'], (result) => {
          if (!result.theme || result.theme === 'system') {
            applyTheme('system');
          }
        });
      }
    });
  }
}
