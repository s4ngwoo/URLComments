global.chrome = {
  i18n: {
    getMessage: jest.fn((key) => key),
  },
  runtime: {
    sendMessage: jest.fn().mockResolvedValue(),
    onMessage: {
      addListener: jest.fn(),
    },
    getURL: jest.fn((path) => path),
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn().mockResolvedValue(),
    onActivated: {
      addListener: jest.fn(),
    },
    onUpdated: {
      addListener: jest.fn(),
    }
  },
  identity: {
    getRedirectURL: jest.fn(() => 'https://mock.redirect.url'),
    launchWebAuthFlow: jest.fn(),
  },
  sidePanel: {
    setPanelBehavior: jest.fn().mockResolvedValue(),
  }
};
