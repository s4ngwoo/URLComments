describe('popup/i18n.js', () => {
  beforeEach(() => {
    jest.resetModules();
    chrome.i18n.getMessage.mockReset();
    chrome.i18n.getMessage.mockImplementation((key) => key);
    chrome.storage.local.get.mockReset();
    chrome.runtime.getURL.mockReset();
    global.fetch = jest.fn();
  });

  it('falls back to chrome.i18n when no custom locale is loaded', async () => {
    const { getMessage } = await import('./i18n.js');
    chrome.i18n.getMessage.mockReturnValue('Login required');

    expect(getMessage('authNoticeDefault')).toBe('Login required');
    expect(chrome.i18n.getMessage).toHaveBeenCalledWith('authNoticeDefault', undefined);
  });

  it('substitutes $1 placeholders from a custom locale pack', async () => {
    chrome.storage.local.get.mockImplementation((key, cb) => cb({ language: 'en' }));
    chrome.runtime.getURL.mockReturnValue('/_locales/en/messages.json');
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        greeting: { message: 'Hello $1' },
      }),
    });

    const { getMessage, initI18n } = await import('./i18n.js');
    await initI18n();

    expect(getMessage('greeting', 'Ada')).toBe('Hello Ada');
    expect(getMessage('greeting', ['Ada'])).toBe('Hello Ada');
  });

  it('leaves chrome.i18n in charge when language is system', async () => {
    chrome.storage.local.get.mockImplementation((key, cb) => cb({ language: 'system' }));
    chrome.i18n.getMessage.mockReturnValue('from-chrome');

    const { getMessage, initI18n } = await import('./i18n.js');
    await initI18n();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(getMessage('anyKey')).toBe('from-chrome');
  });
});
