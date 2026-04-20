import WalletConnectPort from './WalletConnectPort';
import AppConstants from '../AppConstants';
import Engine from '../Engine';
import { selectEvmChainId } from '../../selectors/networkController';
import { store } from '../../store';

jest.mock('../Engine', () => ({
  __esModule: true,
  default: {
    datamodel: {
      state: {
        PreferencesController: { selectedAddress: '0xUSER' },
      },
    },
  },
}));

jest.mock('../../selectors/networkController', () => ({
  selectEvmChainId: jest.fn(),
}));

jest.mock('../../store', () => ({
  store: { getState: jest.fn(() => ({})) },
}));

const { NOTIFICATION_NAMES } = AppConstants;

describe('WalletConnectPort', () => {
  const buildWcActions = () => ({
    updateSession: jest.fn(),
    approveRequest: jest.fn(),
    rejectRequest: jest.fn(),
  });

  beforeEach(() => {
    (selectEvmChainId as unknown as jest.Mock).mockReset();
    (store.getState as jest.Mock).mockReset().mockReturnValue({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Engine as any).datamodel = {
      state: { PreferencesController: { selectedAddress: '0xUSER' } },
    };
  });

  it('updates session with chainId and selectedAddress on chainChanged messages', () => {
    const wc = buildWcActions();
    const port = new WalletConnectPort(wc);

    port.postMessage({
      data: {
        method: NOTIFICATION_NAMES.chainChanged,
        params: { chainId: '0x5' },
      },
    });

    expect(wc.updateSession).toHaveBeenCalledWith({
      chainId: 5,
      accounts: ['0xUSER'],
    });
  });

  it('updates session with chainId from selectors on accountsChanged messages', () => {
    (selectEvmChainId as unknown as jest.Mock).mockReturnValue('42');
    const wc = buildWcActions();
    const port = new WalletConnectPort(wc);

    port.postMessage({
      data: {
        method: NOTIFICATION_NAMES.accountsChanged,
        params: ['0xAcct'],
      },
    });

    expect(wc.updateSession).toHaveBeenCalledWith({
      chainId: 42,
      accounts: ['0xAcct'],
    });
  });

  it('ignores unlockStateChanged notifications', () => {
    const wc = buildWcActions();
    const port = new WalletConnectPort(wc);

    port.postMessage({
      data: { method: NOTIFICATION_NAMES.unlockStateChanged },
    });

    expect(wc.updateSession).not.toHaveBeenCalled();
    expect(wc.approveRequest).not.toHaveBeenCalled();
    expect(wc.rejectRequest).not.toHaveBeenCalled();
  });

  it('rejects the request when the message carries an error', () => {
    const wc = buildWcActions();
    const port = new WalletConnectPort(wc);

    port.postMessage({
      data: { id: 'req-1', error: { code: -1 } },
    });

    expect(wc.rejectRequest).toHaveBeenCalledWith({
      id: 'req-1',
      error: { code: -1 },
    });
  });

  it('approves the request when a regular result is received', () => {
    const wc = buildWcActions();
    const port = new WalletConnectPort(wc);

    port.postMessage({
      data: { id: 'req-2', result: '0xabc' },
    });

    expect(wc.approveRequest).toHaveBeenCalledWith({
      id: 'req-2',
      result: '0xabc',
    });
  });

  it('swallows errors thrown while handling a message', () => {
    const wc = buildWcActions();
    const port = new WalletConnectPort(wc);
    const warnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);

    // Missing data property should throw inside the branch and be caught.
    port.postMessage(null);

    warnSpy.mockRestore();
    expect(wc.approveRequest).not.toHaveBeenCalled();
  });
});
