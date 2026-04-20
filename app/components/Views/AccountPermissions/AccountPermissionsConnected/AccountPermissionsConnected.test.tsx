jest.mock('../../../../component-library/components-temp/SheetActions', () => 'SheetActions');
jest.mock('../../../../components/UI/AccountSelectorList', () => 'AccountSelectorList');
jest.mock('../../../../component-library/components/Toast', () => {
  const { createContext } = require('react');
  return {
    ToastContext: createContext({ toastRef: { current: null } }),
    ToastVariants: { Plain: 'plain', Account: 'account' },
  };
});
jest.mock('../../../../core/Engine', () => ({
  context: {
    PermissionController: {
      revokeAllPermissions: jest.fn(),
    },
  },
}));
jest.mock('../../../../components/hooks/useMetrics', () => ({
  useMetrics: () => ({
    trackEvent: jest.fn(),
    createEventBuilder: jest.fn(() => ({
      addProperties: jest.fn().mockReturnThis(),
      build: jest.fn(),
    })),
  }),
}));

describe('AccountPermissionsConnected', () => {
  it('module exports correctly', () => {
    const mod = require('./AccountPermissionsConnected');
    expect(mod).toBeDefined();
    expect(mod.default).toBeDefined();
  });
});
