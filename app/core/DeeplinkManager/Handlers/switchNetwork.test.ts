import { Alert, AlertButton } from 'react-native';
import switchNetwork from './switchNetwork';
import DeeplinkManager from '../DeeplinkManager';
import { showAlert } from '../../../actions/alert';
import { strings } from '../../../../locales/i18n';
import Engine from '../../Engine';
import { store } from '../../../store';

jest.mock('../../../actions/alert', () => ({
  showAlert: jest.fn((payload) => ({ type: 'SHOW_ALERT', payload })),
}));

jest.mock('../../Engine', () => ({
  context: {
    MultichainNetworkController: {
      state: { isEvmSelected: true },
      setActiveNetwork: jest.fn(),
    },
  },
}));

jest.mock('../../../store', () => ({
  store: { getState: jest.fn() },
}));

const networkConfigurationsByChainId = {
  '0x1': {
    chainId: '0x1',
    name: 'Ethereum Mainnet',
    defaultRpcEndpointIndex: 0,
    rpcEndpoints: [{ networkClientId: 'mainnet' }],
  },
  '0x89': {
    chainId: '0x89',
    name: 'Polygon Mainnet',
    defaultRpcEndpointIndex: 1,
    rpcEndpoints: [
      { networkClientId: 'polygon-a' },
      { networkClientId: 'polygon-b' },
    ],
  },
};

const buildState = (selectedNetworkClientId: string) => ({
  engine: {
    backgroundState: {
      NetworkController: {
        selectedNetworkClientId,
        networkConfigurationsByChainId,
        networksMetadata: {},
      },
      MultichainNetworkController: {
        isEvmSelected: true,
        multichainNetworkConfigurationsByChainId: {},
      },
    },
  },
});

describe('switchNetwork', () => {
  let deeplinkManager: DeeplinkManager;
  const mockSetActiveNetwork = jest.mocked(
    Engine.context.MultichainNetworkController.setActiveNetwork,
  );
  const multichainState = Engine.context.MultichainNetworkController.state as {
    isEvmSelected: boolean;
  };
  let alertSpy: jest.SpyInstance;

  const respondToPrompt = (buttonIndex: number) =>
    alertSpy.mockImplementation((_title, _message, buttons) => {
      (buttons as AlertButton[])[buttonIndex].onPress?.();
    });

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert');
    multichainState.isEvmSelected = true;
    jest
      .mocked(store.getState)
      .mockReturnValue(
        buildState('mainnet') as unknown as ReturnType<typeof store.getState>,
      );
    deeplinkManager = { dispatch: jest.fn() } as unknown as DeeplinkManager;
  });

  it('does not switch until the user confirms, then switches and shows a toast', async () => {
    let confirm: (() => void) | undefined;
    alertSpy.mockImplementation((_title, _message, buttons) => {
      confirm = (buttons as AlertButton[])[1].onPress as () => void;
    });

    const result = switchNetwork({ deeplinkManager, switchToChainId: '137' });

    expect(alertSpy).toHaveBeenCalledWith(
      strings('deeplink.switch_network_title'),
      strings('deeplink.switch_network_description', {
        networkName: 'Polygon Mainnet',
      }),
      expect.any(Array),
      expect.objectContaining({ cancelable: true }),
    );
    expect(mockSetActiveNetwork).not.toHaveBeenCalled();

    confirm?.();

    await expect(result).resolves.toBe(true);
    expect(mockSetActiveNetwork).toHaveBeenCalledWith('polygon-b');
    expect(deeplinkManager.dispatch).toHaveBeenCalledWith(
      showAlert({
        isVisible: true,
        autodismiss: 5000,
        content: 'clipboard-alert',
        data: { msg: strings('send.warn_network_change') + 'Polygon Mainnet' },
      }),
    );
  });

  it('keeps the active network when the user cancels', async () => {
    respondToPrompt(0);

    await expect(
      switchNetwork({ deeplinkManager, switchToChainId: '137' }),
    ).resolves.toBe(false);

    expect(mockSetActiveNetwork).not.toHaveBeenCalled();
    expect(deeplinkManager.dispatch).not.toHaveBeenCalled();
  });

  it('keeps the active network when the prompt is dismissed', async () => {
    alertSpy.mockImplementation((_title, _message, _buttons, options) => {
      options?.onDismiss?.();
    });

    await expect(
      switchNetwork({ deeplinkManager, switchToChainId: '137' }),
    ).resolves.toBe(false);

    expect(mockSetActiveNetwork).not.toHaveBeenCalled();
  });

  it('does not prompt when the requested chain is already active', async () => {
    await expect(
      switchNetwork({ deeplinkManager, switchToChainId: '1' }),
    ).resolves.toBe(true);

    expect(alertSpy).not.toHaveBeenCalled();
    expect(mockSetActiveNetwork).not.toHaveBeenCalled();
  });

  it('prompts before re-activating the EVM network when a non-EVM network is selected', async () => {
    multichainState.isEvmSelected = false;
    respondToPrompt(1);

    await expect(
      switchNetwork({ deeplinkManager, switchToChainId: '1' }),
    ).resolves.toBe(true);

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(mockSetActiveNetwork).toHaveBeenCalledWith('mainnet');
  });

  it('throws without prompting for a chain that is not configured', async () => {
    await expect(
      switchNetwork({ deeplinkManager, switchToChainId: '56' }),
    ).rejects.toThrow('Unable to find network with chain id 56');

    expect(alertSpy).not.toHaveBeenCalled();
    expect(mockSetActiveNetwork).not.toHaveBeenCalled();
  });

  it('continues without switching when no chain id is given', async () => {
    await expect(
      switchNetwork({ deeplinkManager, switchToChainId: undefined }),
    ).resolves.toBe(true);

    expect(alertSpy).not.toHaveBeenCalled();
    expect(mockSetActiveNetwork).not.toHaveBeenCalled();
  });
});
