/**
 * initI18n fail-closed paths. Success / $1 substitution live on a separate coverage PR.
 */
describe('popup/i18n.js fetch failures', () => {
  beforeEach(() => {
    jest.resetModules();
    chrome.i18n.getMessage.mockReset();
    chrome.i18n.getMessage.mockImplementation((key) => `chrome:${key}`);
    chrome.storage.local.get.mockReset();
    chrome.runtime.getURL.mockReset();
    chrome.runtime.getURL.mockImplementation((path) => `/${path}`);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
  });

  it('keeps chrome.i18n when the custom locale response is not ok', async () => {
    chrome.storage.local.get.mockImplementation((key, cb) => cb({ language: 'ko' }));
    global.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ greeting: { message: 'should-not-load' } }),
    });

    const { getMessage, initI18n } = await import('./i18n.js');
    await initI18n();

    expect(getMessage('greeting')).toBe('chrome:greeting');
    expect(chrome.i18n.getMessage).toHaveBeenCalledWith('greeting', undefined);
  });

  it('keeps chrome.i18n when locale fetch throws', async () => {
    chrome.storage.local.get.mockImplementation((key, cb) => cb({ language: 'en' }));
    global.fetch.mockRejectedValue(new Error('network down'));

    const { getMessage, initI18n } = await import('./i18n.js');
    await initI18n();

    expect(getMessage('anyKey')).toBe('chrome:anyKey');
  });
});
