const { getSpaKey, handleRuntimeMessage } = require('./background');

describe('background runtime messaging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete chrome.runtime.lastError;
  });

  it('builds a per-tab SPA storage key', () => {
    expect(getSpaKey(42)).toBe('42_isSpa');
  });

  it('keeps LAUNCH_WEB_AUTH_FLOW async so popup auth does not hang', () => {
    chrome.identity.launchWebAuthFlow.mockImplementation((_opts, cb) => {
      cb('https://mock.redirect.url/#access_token=abc&refresh_token=def');
    });

    const sendResponse = jest.fn();
    const keepChannelOpen = handleRuntimeMessage(
      {
        type: 'LAUNCH_WEB_AUTH_FLOW',
        url: 'https://accounts.google.com/o/oauth',
        interactive: true,
      },
      {},
      sendResponse
    );

    expect(keepChannelOpen).toBe(true);
    expect(chrome.identity.launchWebAuthFlow).toHaveBeenCalledWith(
      {
        url: 'https://accounts.google.com/o/oauth',
        interactive: true,
      },
      expect.any(Function)
    );
    expect(sendResponse).toHaveBeenCalledWith({
      authUrl: 'https://mock.redirect.url/#access_token=abc&refresh_token=def',
    });
  });

  it('forwards identity lastError instead of an empty auth URL', () => {
    chrome.runtime.lastError = { message: 'The user did not approve access.' };
    chrome.identity.launchWebAuthFlow.mockImplementation((_opts, cb) => {
      cb(undefined);
    });

    const sendResponse = jest.fn();
    handleRuntimeMessage(
      { type: 'LAUNCH_WEB_AUTH_FLOW', url: 'https://oauth.example', interactive: true },
      {},
      sendResponse
    );

    expect(sendResponse).toHaveBeenCalledWith({
      error: 'The user did not approve access.',
    });
  });

  it('persists SPA detection against the sending tab', () => {
    chrome.storage.local.set.mockImplementation((_value, cb) => cb && cb());

    const keepChannelOpen = handleRuntimeMessage(
      { type: 'SPA_DETECTED' },
      { tab: { id: 7 } },
      jest.fn()
    );

    expect(keepChannelOpen).toBe(false);
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      { '7_isSpa': true },
      expect.any(Function)
    );
  });
});
