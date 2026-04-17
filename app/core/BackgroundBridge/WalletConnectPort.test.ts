import WalletConnectPort from './WalletConnectPort';

jest.mock('../Engine', () => ({
  __esModule: true,
  default: {
    datamodel: {
      state: {
        PreferencesController: {
          selectedAddress: '0x123',
        },
      },
    },
  },
}));

jest.mock('../../selectors/networkController', () => ({
  selectEvmChainId: jest.fn(() => '1'),
}));

jest.mock('../../store', () => ({
  store: {
    getState: jest.fn(() => ({})),
  },
}));

describe('WalletConnectPort', () => {
  it('can be instantiated', () => {
    const port = new WalletConnectPort({});
    expect(port).toBeDefined();
  });

  it('extends EventEmitter', () => {
    const port = new WalletConnectPort({});
    expect(typeof port.on).toBe('function');
    expect(typeof port.emit).toBe('function');
  });

  it('has postMessage method', () => {
    const port = new WalletConnectPort({});
    expect(typeof port.postMessage).toBe('function');
  });

  it('calls approveRequest for regular messages', () => {
    const mockActions = {
      approveRequest: jest.fn(),
    };
    const port = new WalletConnectPort(mockActions);
    port.postMessage({
      data: { id: 1, result: 'success' },
    });
    expect(mockActions.approveRequest).toHaveBeenCalledWith({
      id: 1,
      result: 'success',
    });
  });

  it('calls rejectRequest for error messages', () => {
    const mockActions = {
      rejectRequest: jest.fn(),
    };
    const port = new WalletConnectPort(mockActions);
    port.postMessage({
      data: { id: 1, error: 'some error' },
    });
    expect(mockActions.rejectRequest).toHaveBeenCalledWith({
      id: 1,
      error: 'some error',
    });
  });

  it('handles null message gracefully', () => {
    const port = new WalletConnectPort({});
    expect(() => port.postMessage(null)).not.toThrow();
  });

  it('handles message with no data gracefully', () => {
    const port = new WalletConnectPort({});
    expect(() => port.postMessage({})).not.toThrow();
  });
});
