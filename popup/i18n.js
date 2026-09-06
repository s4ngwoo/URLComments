/**
 * Custom i18n module to support language selection in Settings
 */

let customMessages = null;

export async function initI18n() {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;
  
  try {
    const result = await new Promise(resolve => chrome.storage.local.get('language', resolve));
    const lang = result.language || 'system';
    
    if (lang === 'system') {
      return; // Fallback to chrome.i18n
    }
    
    const url = chrome.runtime.getURL(`_locales/${lang}/messages.json`);
    const response = await fetch(url);
    if (response.ok) {
      customMessages = await response.json();
    } else {
      console.error(`Failed to load custom locale: ${lang} (${response.status})`);
    }
  } catch (err) {
    console.error('Error initializing custom i18n:', err);
  }
}

export function getMessage(key, substitutions) {
  if (customMessages && customMessages[key]) {
    let msg = customMessages[key].message;
    if (substitutions) {
      const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
      // Chrome extension messages format sometimes uses $1, $2, etc.
      subs.forEach((sub, i) => {
        msg = msg.replace(new RegExp(`\\$${i + 1}`, 'g'), sub);
      });
    }
    return msg;
  }
  
  if (typeof chrome !== 'undefined' && chrome.i18n) {
    return chrome.i18n.getMessage(key, substitutions);
  }
  
  return key;
}
