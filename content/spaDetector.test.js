const { startSpaDetector } = require('./spaDetector');

describe('SPA Detector', () => {
  let mockGlobalDeps;
  
  beforeEach(() => {
    mockGlobalDeps = {
      window: {
        addEventListener: jest.fn(),
      },
      history: {
        pushState: jest.fn(),
        replaceState: jest.fn(),
      },
      document: {
        querySelector: jest.fn(() => ({})), // Mock main node
      },
      chrome: {
        runtime: {
          sendMessage: jest.fn(),
        }
      },
      location: {
        hostname: 'example.com'
      }
    };
    
    // Mock MutationObserver
    global.MutationObserver = class {
      constructor(callback) {
        this.callback = callback;
        this.disconnect = jest.fn();
        this.observe = jest.fn();
      }
    };
    
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should immediately notify if domain matches known SPA', () => {
    mockGlobalDeps.location.hostname = 'instagram.com';
    startSpaDetector(['instagram.com'], mockGlobalDeps);
    
    expect(mockGlobalDeps.chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'SPA_DETECTED',
      hostname: 'instagram.com'
    });
  });

  it('should not notify immediately for non-SPA domains', () => {
    startSpaDetector(['instagram.com'], mockGlobalDeps);
    expect(mockGlobalDeps.chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it('should wrap pushState and notify on call', () => {
    const originalPushState = mockGlobalDeps.history.pushState;
    startSpaDetector(['instagram.com'], mockGlobalDeps);
    
    // Simulate pushState
    mockGlobalDeps.history.pushState({}, '', '/new-url');
    
    expect(mockGlobalDeps.chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'SPA_DETECTED',
      hostname: 'example.com'
    });
    expect(originalPushState).toHaveBeenCalledWith({}, '', '/new-url');
  });

  it('should wrap replaceState and notify on call', () => {
    const originalReplaceState = mockGlobalDeps.history.replaceState;
    startSpaDetector(['instagram.com'], mockGlobalDeps);
    
    // Simulate replaceState
    mockGlobalDeps.history.replaceState({}, '', '/new-url');
    
    expect(mockGlobalDeps.chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'SPA_DETECTED',
      hostname: 'example.com'
    });
    expect(originalReplaceState).toHaveBeenCalledWith({}, '', '/new-url');
  });

  it('should register popstate listener', () => {
    startSpaDetector(['instagram.com'], mockGlobalDeps);
    expect(mockGlobalDeps.window.addEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
    
    // Trigger popstate listener
    const popstateCallback = mockGlobalDeps.window.addEventListener.mock.calls[0][1];
    popstateCallback();
    
    expect(mockGlobalDeps.chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'SPA_DETECTED',
      hostname: 'example.com'
    });
  });
});
