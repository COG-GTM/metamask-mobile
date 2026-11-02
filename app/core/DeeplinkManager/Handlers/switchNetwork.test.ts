import { Alert, AlertButton } from 'react-native';
import switchNetwork from './switchNetwork';
import DeeplinkManager from '../DeeplinkManager';
import { showAlert } from '../../../actions/alert';
import { strings } from '../../../../locales/i18n';
import { handleNetworkSwitch } from '../../../util/networks/handleNetworkSwitch';
import { store } from '../../../store';
import { RootState } from '../../../reducers';

jest.mock('../../../util/networks/handleNetworkSwitch', () => ({
  handleNetworkSwitch: jest.fn(),
}));

jest.mock('../../../actions/alert', () => ({
  showAlert: jest.fn(),
}));

jest.mock('../../../store', () => ({
  store: { getState: jest.fn() },
}));

const buildState = (selectedChainId: string) =>
  ({
    engine: {
      backgroundState: {
        NetworkController: {
          selectedNetworkClientId:
            selectedChainId === '0x1' ? 'mainnet' : 'linea',
          networkConfigurationsByChainId: {
            '0x1': {
              chainId: '0x1',
              name: 'Ethereum Mainnet',
              defaultRpcEndpointIndex: 0,
              rpcEndpoints: [{ networkClientId: 'mainnet' }],
            },
            '0xe708': {
              chainId: '0xe708',
              name: 'Linea',
              defaultRpcEndpointIndex: 0,
              rpcEndpoints: [{ networkClientId: 'linea' }],
            },
          },
        },
      },
    },
  } as unknown as RootState);

type AlertCall = [string, string, AlertButton[], { onDismiss?: () => void }];

describe('switchNetwork', () => {
  let deeplinkManager: DeeplinkManager;
  const mockHandleNetworkSwitch = jest.mocked(handleNetworkSwitch);
  const mockGetState = jest.mocked(store.getState);
  let spyAlert: jest.SpyInstance;

  const lastPrompt = () => spyAlert.mock.calls.at(-1) as AlertCall;
  const pressButton = (index: number) => lastPrompt()[2][index].onPress?.();

  beforeEach(() => {
    jest.clearAllMocks();
    spyAlert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

    deeplinkManager = {
      dispatch: jest.fn(),
    } as unknown as DeeplinkManager;

    mockGetState.mockReturnValue(buildState('0x1'));
    mockHandleNetworkSwitch.mockReturnValue('Linea');
  });

  it('does not switch the network before the user approves', async () => {
    const result = switchNetwork({ deeplinkManager, switchToChainId: '59144' });

    expect(spyAlert).toHaveBeenCalledTimes(1);
    expect(lastPrompt()[0]).toBe(strings('deeplink.network_switch_title'));
    expect(lastPrompt()[1]).toBe(
      strings('deeplink.network_switch_message', {
        currentNetworkName: 'Ethereum Mainnet',
        networkName: 'Linea',
      }),
    );
    expect(mockHandleNetworkSwitch).not.toHaveBeenCalled();
    expect(deeplinkManager.dispatch).not.toHaveBeenCalled();

    pressButton(1);
    await expect(result).resolves.toBe(true);
  });

  it('switches the network and shows the toast once the user approves', async () => {
    const result = switchNetwork({ deeplinkManager, switchToChainId: '59144' });
    pressButton(1);

    await expect(result).resolves.toBe(true);
    expect(mockHandleNetworkSwitch).toHaveBeenCalledWith('59144');
    expect(deeplinkManager.dispatch).toHaveBeenCalledWith(
      showAlert({
        isVisible: true,
        autodismiss: 5000,
        content: 'clipboard-alert',
        data: { msg: strings('send.warn_network_change') + 'Linea' },
      }),
    );
  });

  it('keeps the current network when the user cancels', async () => {
    const result = switchNetwork({ deeplinkManager, switchToChainId: '59144' });
    pressButton(0);

    await expect(result).resolves.toBe(false);
    expect(mockHandleNetworkSwitch).not.toHaveBeenCalled();
    expect(deeplinkManager.dispatch).not.toHaveBeenCalled();
  });

  it('keeps the current network when the prompt is dismissed', async () => {
    const result = switchNetwork({ deeplinkManager, switchToChainId: '59144' });
    lastPrompt()[3].onDismiss?.();

    await expect(result).resolves.toBe(false);
    expect(mockHandleNetworkSwitch).not.toHaveBeenCalled();
  });

  it('does not prompt when the requested network is already active', async () => {
    await expect(
      switchNetwork({ deeplinkManager, switchToChainId: '1' }),
    ).resolves.toBe(true);

    expect(spyAlert).not.toHaveBeenCalled();
    expect(mockHandleNetworkSwitch).not.toHaveBeenCalled();
  });

  it('does not prompt when no chain id is requested', async () => {
    await expect(
      switchNetwork({ deeplinkManager, switchToChainId: undefined }),
    ).resolves.toBe(true);

    expect(spyAlert).not.toHaveBeenCalled();
    expect(mockHandleNetworkSwitch).not.toHaveBeenCalled();
  });

  it('throws without prompting for a network that is not configured', async () => {
    const switchToChainId = '56' as `${number}`;

    await expect(
      switchNetwork({ deeplinkManager, switchToChainId }),
    ).rejects.toThrow(
      `Unable to find network with chain id ${switchToChainId}`,
    );

    expect(spyAlert).not.toHaveBeenCalled();
    expect(mockHandleNetworkSwitch).not.toHaveBeenCalled();
  });
});
