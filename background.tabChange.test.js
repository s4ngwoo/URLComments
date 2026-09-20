/**
 * Background tab-change sender. The popup TAB_CHANGED handler is covered
 * elsewhere; these cases lock the service-worker broadcast rules.
 */

describe('background.js TAB_CHANGED broadcast', () => {
  let onActivated;
  let onUpdated;

  beforeEach(() => {
    jest.resetModules();
    chrome.tabs.onActivated.addListener.mockClear();
    chrome.tabs.onUpdated.addListener.mockClear();
    chrome.runtime.sendMessage.mockReset();
    chrome.runtime.sendMessage.mockResolvedValue(undefined);
    chrome.sidePanel.setPanelBehavior.mockResolvedValue(undefined);
    chrome.runtime.onMessage.addListener.mockClear();

    jest.isolateModules(() => {
      require('./background.js');
    });

    onActivated = chrome.tabs.onActivated.addListener.mock.calls[0][0];
    onUpdated = chrome.tabs.onUpdated.addListener.mock.calls[0][0];
  });

  test('tab activation broadcasts TAB_CHANGED', () => {
    onActivated({ tabId: 7, windowId: 1 });
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'TAB_CHANGED' });
  });

  test('active tab finishing load broadcasts TAB_CHANGED', () => {
    onUpdated(3, { status: 'complete' }, { id: 3, active: true });
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'TAB_CHANGED' });
  });

  test('incomplete load on the active tab does not broadcast', () => {
    onUpdated(3, { status: 'loading' }, { id: 3, active: true });
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });

  test('completed load on a background tab does not broadcast', () => {
    onUpdated(4, { status: 'complete' }, { id: 4, active: false });
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });
});
