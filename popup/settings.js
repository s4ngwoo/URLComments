export function initSettings() {
  const themeSelect = document.getElementById('theme-select');
  if (!themeSelect) return;

  // Load saved theme
  chrome.storage.local.get(['theme'], (result) => {
    const theme = result.theme || 'system';
    themeSelect.value = theme;
    applyTheme(theme);
  });

  // Handle theme change
  themeSelect.addEventListener('change', (e) => {
    const theme = e.target.value;
    chrome.storage.local.set({ theme });
    applyTheme(theme);
  });
}

function applyTheme(theme) {
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

// Listen for system theme changes if set to system
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  chrome.storage.local.get(['theme'], (result) => {
    if (!result.theme || result.theme === 'system') {
      applyTheme('system');
    }
  });
});
