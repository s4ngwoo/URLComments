const { startSpaDetector } = require('./spaDetector');

describe('SPA detector notify throttle', () => {
  let mockGlobalDeps;

  beforeEach(() => {
    mockGlobalDeps = {
      window: { addEventListener: jest.fn() },
      history: {
        pushState: jest.fn(),
        replaceState: jest.fn(),
      },
      document: { querySelector: jest.fn(() => ({})) },
      chrome: { runtime: { sendMessage: jest.fn() } },
      location: { hostname: 'example.com' },
    };
    global.MutationObserver = class {
      disconnect() {}
      observe() {}
    };
    jest.useFakeTimers();
    jest.setSystemTime(500);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('drops a second history notification inside the 1s throttle window', () => {
    startSpaDetector(['instagram.com'], mockGlobalDeps);

    mockGlobalDeps.history.pushState({}, '', '/one');
    expect(mockGlobalDeps.chrome.runtime.sendMessage).not.toHaveBeenCalled();

    jest.setSystemTime(1600);
    mockGlobalDeps.history.pushState({}, '', '/two');

    expect(mockGlobalDeps.chrome.runtime.sendMessage).toHaveBeenCalledTimes(1);
    expect(mockGlobalDeps.chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'SPA_DETECTED',
      hostname: 'example.com',
    });
  });

  it('latches after the first successful notify so later pushState does not rebroadcast', () => {
    jest.setSystemTime(5_000);
    startSpaDetector(['instagram.com'], mockGlobalDeps);

    mockGlobalDeps.history.pushState({}, '', '/one');
    mockGlobalDeps.history.pushState({}, '', '/two');

    expect(mockGlobalDeps.chrome.runtime.sendMessage).toHaveBeenCalledTimes(1);
  });
});
