jest.mock('../../../../component-library/components-temp/SheetActions', () => 'SheetActions');
jest.mock('../../../../components/UI/AccountSelectorList', () => 'AccountSelectorList');
jest.mock('../../../../component-library/components/Toast', () => {
  const { createContext } = require('react');
  return {
    ToastContext: createContext({ toastRef: { current: null } }),
    ToastVariants: { Plain: 'plain' },
  };
});
jest.mock('../../../../component-library/hooks', () => ({
  useStyles: () => ({
    styles: {},
  }),
}));

describe('AccountConnectSingle', () => {
  it('module exports correctly', () => {
    const mod = require('./AccountConnectSingle');
    expect(mod).toBeDefined();
    expect(mod.default).toBeDefined();
  });
});
