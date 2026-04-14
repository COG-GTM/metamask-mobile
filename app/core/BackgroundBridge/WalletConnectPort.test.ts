import WalletConnectPort from './WalletConnectPort';

jest.mock('../Engine', () => ({
  default: {
    datamodel: {
      state: {
        PreferencesController: { selectedAddress: '0xTestAddress' },
      },
    },
  },
}));

jest.mock('../AppConstants', () => ({
  default: {
    NOTIFICATION_NAMES: {
      accountsChanged: 'metamask_accountsChanged',
      unlockStateChanged: 'metamask_unlockStateChanged',
      chainChanged: 'metamask_chainChanged',
    },
  },
}));

jest.mock('../../selectors/networkController', () => ({
  selectEvmChainId: jest.fn().mockReturnValue('0x1'),
}));

jest.mock('../../store', () => ({
  store: { getState: jest.fn().mockReturnValue({}) },
}));

describe('WalletConnectPort', () => {
  it('should create a WalletConnectPort instance', () => {
    const port = new WalletConnectPort({});
    expect(port).toBeDefined();
  });

  it('should handle chainChanged notification', () => {
    const updateSession = jest.fn();
    const port = new WalletConnectPort({ updateSession });
    port.postMessage({
      data: {
        method: 'metamask_chainChanged',
        params: { chainId: '0xa' },
      },
    });
    expect(updateSession).toHaveBeenCalledWith({
      chainId: 10,
      accounts: ['0xTestAddress'],
    });
  });

  it('should handle accountsChanged notification', () => {
    const updateSession = jest.fn();
    const port = new WalletConnectPort({ updateSession });
    port.postMessage({
      data: {
        method: 'metamask_accountsChanged',
        params: ['0xNewAccount'],
      },
    });
    expect(updateSession).toHaveBeenCalled();
  });

  it('should handle error messages', () => {
    const rejectRequest = jest.fn();
    const port = new WalletConnectPort({ rejectRequest });
    port.postMessage({
      data: {
        id: 1,
        error: { message: 'rejected' },
      },
    });
    expect(rejectRequest).toHaveBeenCalledWith({
      id: 1,
      error: { message: 'rejected' },
    });
  });

  it('should handle success messages', () => {
    const approveRequest = jest.fn();
    const port = new WalletConnectPort({ approveRequest });
    port.postMessage({
      data: {
        id: 2,
        result: '0xHash',
      },
    });
    expect(approveRequest).toHaveBeenCalledWith({
      id: 2,
      result: '0xHash',
    });
  });

  it('should inherit from EventEmitter', () => {
    const port = new WalletConnectPort({});
    expect(typeof port.on).toBe('function');
    expect(typeof port.emit).toBe('function');
  });
});
