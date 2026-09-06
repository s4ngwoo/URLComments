const fs = require('fs');
const path = require('path');

describe('Localization (i18n) and Manifest Verification', () => {
  const LOCALES = ['ko', 'en', 'ja', 'zh_CN', 'zh_TW', 'es'];
  const localesDir = path.join(__dirname, '../_locales');
  const manifestPath = path.join(__dirname, '../manifest.json');

  let localeData = {};
  let canonicalKeys = [];

  beforeAll(() => {
    LOCALES.forEach(loc => {
      const filePath = path.join(localesDir, loc, 'messages.json');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(content);
      localeData[loc] = parsed;
    });

    // Dynamically derive canonical reference key set from Korean (ko)
    canonicalKeys = Object.keys(localeData.ko).sort();
  });

  test('canonical reference key set is non-empty', () => {
    expect(canonicalKeys.length).toBeGreaterThan(0);
  });

  test('all 6 locales have the exact same sorted key set as the canonical reference', () => {
    LOCALES.forEach(loc => {
      const locKeys = Object.keys(localeData[loc]).sort();
      expect(locKeys).toEqual(canonicalKeys);
    });
  });

  test('every key in every locale contains a non-empty message string', () => {
    LOCALES.forEach(loc => {
      canonicalKeys.forEach(key => {
        const item = localeData[loc][key];
        expect(item).toBeDefined();
        expect(typeof item.message).toBe('string');
        expect(item.message.trim().length).toBeGreaterThan(0);
      });
    });
  });

  test('product name URLComments is preserved identically across all 6 locales', () => {
    LOCALES.forEach(loc => {
      expect(localeData[loc].appName.message).toBe('URLComments');
    });
  });

  test('manifest.json references localized appName and appDesc with default_locale "en"', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    expect(manifest.name).toBe('__MSG_appName__');
    expect(manifest.description).toBe('__MSG_appDesc__');
    expect(manifest.default_locale).toBe('en');
    expect(manifest.action.default_title).toBe('__MSG_appName__');

    // Verify appName and appDesc resolve and are non-empty in all locales
    LOCALES.forEach(loc => {
      expect(localeData[loc].appName).toBeDefined();
      expect(localeData[loc].appName.message.length).toBeGreaterThan(0);
      expect(localeData[loc].appDesc).toBeDefined();
      expect(localeData[loc].appDesc.message.length).toBeGreaterThan(0);
    });
  });

  test('Traditional Chinese (zh_TW) consistently uses 留言 instead of 評論', () => {
    const zhTw = localeData.zh_TW;
    Object.entries(zhTw).forEach(([key, val]) => {
      expect(val.message).not.toContain('評論');
      expect(val.message).not.toContain('评论');
    });
  });
});
