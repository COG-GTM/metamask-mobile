import { parse } from 'eth-url-parser';
import { Alert } from 'react-native';
import { ETH_ACTIONS } from '../../../constants/deeplinks';
import { NetworkSwitchErrorType } from '../../../constants/error';
import DeeplinkManager from '../DeeplinkManager';
import handleEthereumUrl from './handleEthereumUrl';
import { getDecimalChainId } from '../../../util/networks';
import Engine from '../../Engine';
import { MAINNET } from '../../../constants/network';
import {
  addTransactionForDeeplink,
  isDeeplinkRedesignedConfirmationCompatible,
} from '../../../components/Views/confirmations/utils/deeplink';

jest.mock('react-native');

jest.mock('eth-url-parser', () => ({
  parse: jest.fn(),
}));

jest.mock('../../../util/networks', () => ({
  getDecimalChainId: jest.fn(),
}));

jest.mock('../../../../locales/i18n', () => ({
  strings: jest.fn((key) => key),
}));

jest.mock('../../Engine', () => ({
  context: {
    MultichainNetworkController: {
      state: {
        isEvmSelected: true,
      },
      setActiveNetwork: jest.fn(),
    },
    NetworkController: {
      setProviderType: jest.fn(),
    },
  },
}));

jest.mock('../../../components/Views/confirmations/utils/deeplink');

jest.mock('../../../store', () => ({
  store: { getState: jest.fn(() => ({})) },
}));

jest.mock('../../../selectors/networkController', () => ({
  selectEvmNetworkConfigurationsByChainId: jest.fn(() => ({
    '0x1': { name: 'Ethereum Mainnet' },
    '0xe708': { name: 'Linea' },
  })),
}));

jest.mock('../../../selectors/multichainNetworkController', () => ({
  selectSelectedNonEvmNetworkName: jest.fn(() => 'Solana'),
}));

const mockUtilHandleNetworkSwitch = jest.fn();
jest.mock('../../../util/networks/handleNetworkSwitch', () => ({
  handleNetworkSwitch: (...args: unknown[]) =>
    mockUtilHandleNetworkSwitch(...args),
}));

const mockRequestApproval = jest.fn();
jest.mock('./switchNetwork', () => ({
  requestDeeplinkNetworkSwitchApproval: (...args: unknown[]) =>
    mockRequestApproval(...args),
}));

describe('handleEthereumUrl', () => {
  let deeplinkManager: DeeplinkManager;
  const mockParse = parse as jest.Mock;
  const mockGetDecimalChainId = getDecimalChainId as jest.Mock;

  const mockHandleNetworkSwitch = jest.fn();
  const mockNavigate = jest.fn();
  const mockApproveTransaction = jest.fn();
  const mockIsDeeplinkRedesignedConfirmationCompatible = jest.mocked(
    isDeeplinkRedesignedConfirmationCompatible,
  );
  const mockAddTransactionForDeeplink = jest.mocked(addTransactionForDeeplink);

  beforeEach(() => {
    jest.clearAllMocks();

    deeplinkManager = {
      _handleNetworkSwitch: mockHandleNetworkSwitch,
      _approveTransaction: mockApproveTransaction,
      navigation: {
        navigate: mockNavigate,
      },
    } as unknown as DeeplinkManager;

    mockParse.mockReturnValue({
      function_name: ETH_ACTIONS.TRANSFER,
      chain_id: 1,
    });

    mockHandleNetworkSwitch.mockResolvedValue(true);
    mockRequestApproval.mockResolvedValue(true);

    mockNavigate.mockImplementation(() => {
      // do nothing
    });

    mockIsDeeplinkRedesignedConfirmationCompatible.mockReturnValue(false);
    mockAddTransactionForDeeplink.mockResolvedValue(
      {} as ReturnType<typeof addTransactionForDeeplink>,
    );
  });

  it('alerts and throws on invalid URL', async () => {
    const spyAlert = jest.spyOn(Alert, 'alert');

    const url = 'invalid_url';
    const origin = 'test_origin';

    mockParse.mockImplementation(() => {
      throw new Error('Invalid URL');
    });

    await handleEthereumUrl({ deeplinkManager, url, origin });

    expect(spyAlert).toHaveBeenCalledWith(
      'deeplink.invalid',
      'Error: Invalid URL',
    );
  });

  it('shows deprecation modal if url is a goerli url', async () => {
    const url = 'ethereum:transfer';
    const origin = 'test_origin';
    mockParse.mockReturnValue({
      function_name: ETH_ACTIONS.TRANSFER,
      chain_id: 5,
    });

    mockGetDecimalChainId.mockReturnValue(5);

    await handleEthereumUrl({ deeplinkManager, url, origin });

    expect(deeplinkManager.navigation.navigate).toHaveBeenCalledWith(
      'DeprecatedNetworkDetails',
      {},
    );
    expect(deeplinkManager._handleNetworkSwitch).toHaveBeenCalledTimes(0);
  });

  it('navigates to SendView for TRANSFER action', async () => {
    const url = 'ethereum:transfer';
    const origin = 'test_origin';
    mockParse.mockReturnValue({
      function_name: ETH_ACTIONS.TRANSFER,
      chain_id: 1,
    });

    await handleEthereumUrl({ deeplinkManager, url, origin });

    expect(deeplinkManager.navigation.navigate).toHaveBeenCalledWith(
      'SendView',
      expect.any(Object),
    );
  });

  it('shows alert when there is a network switch error', async () => {
    const spyAlert = jest.spyOn(Alert, 'alert');

    const url = 'ethereum:transfer';
    const origin = 'test_origin';

    mockParse.mockReturnValue({
      function_name: ETH_ACTIONS.TRANSFER,
      chain_id: 1,
    });

    mockHandleNetworkSwitch.mockRejectedValue(
      new Error(NetworkSwitchErrorType.missingNetworkId),
    );

    await handleEthereumUrl({ deeplinkManager, url, origin });

    expect(spyAlert).toHaveBeenCalledWith(
      'send.network_not_found_title',
      'send.network_missing_id',
    );
  });

  it('calls _approveTransaction for APPROVE action', async () => {
    const url = 'ethereum:approve';
    const origin = 'test_origin';
    mockParse.mockReturnValue({
      function_name: ETH_ACTIONS.APPROVE,
      chain_id: 1,
      parameters: {},
    });

    await handleEthereumUrl({ deeplinkManager, url, origin });

    expect(deeplinkManager._approveTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      origin,
    );
  });

  it('navigates to SendFlowView for default action', async () => {
    const url = 'ethereum:unknownAction';
    const origin = 'test_origin';
    mockParse.mockReturnValue({
      function_name: 'unknownAction',
      chain_id: 1,
      parameters: {},
    });

    await handleEthereumUrl({ deeplinkManager, url, origin });

    expect(deeplinkManager.navigation.navigate).toHaveBeenCalledWith(
      'SendFlowView',
      expect.any(Object),
    );
  });

  it('calls addTransactionForDeeplink if deeplink is compatible with redesigned confirmation', async () => {
    mockIsDeeplinkRedesignedConfirmationCompatible.mockReturnValue(true);
    const url = 'ethereum:transfer';
    const origin = 'test_origin';
    mockParse.mockReturnValue({
      function_name: ETH_ACTIONS.TRANSFER,
      chain_id: 1,
    });

    await handleEthereumUrl({ deeplinkManager, url, origin });

    expect(mockIsDeeplinkRedesignedConfirmationCompatible).toHaveBeenCalledWith(
      ETH_ACTIONS.TRANSFER,
    );

    expect(
      mockIsDeeplinkRedesignedConfirmationCompatible,
    ).toHaveBeenCalledTimes(1);

    expect(mockAddTransactionForDeeplink).toHaveBeenCalledWith({
      function_name: ETH_ACTIONS.TRANSFER,
      chain_id: 1,
      source: url,
    });
  });

  it('shows alert when there is an unknown error during Ethereum URL handling', async () => {
    const spyAlert = jest.spyOn(Alert, 'alert');

    const url = 'ethereum:transfer';
    const origin = 'test_origin';
    mockParse.mockReturnValue({
      function_name: ETH_ACTIONS.TRANSFER,
      chain_id: 1,
    });
    mockHandleNetworkSwitch.mockResolvedValue(true);

    mockNavigate.mockImplementation(() => {
      throw new Error('Unknown error');
    });

    await handleEthereumUrl({ deeplinkManager, url, origin });

    expect(spyAlert).toHaveBeenCalledWith(
      'send.network_not_found_title',
      'send.network_not_found_description',
    );
  });

  it('navigates to SendFlowView for unknown function_name', async () => {
    const url = 'ethereum:sign';
    const origin = 'test_origin';

    mockParse.mockReturnValue({
      function_name: 'unknown',
      chain_id: 1,
      parameters: {},
    });

    await handleEthereumUrl({ deeplinkManager, url, origin });

    expect(deeplinkManager.navigation.navigate).toHaveBeenCalledWith(
      'SendFlowView',
      expect.any(Object),
    );
  });

  it('shows alert when there is a generic error during network switch', async () => {
    const url = 'ethereum:sign';
    const origin = 'test_origin';
    const mockError = new Error('Generic network switch error');
    const spyAlert = jest.spyOn(Alert, 'alert');

    mockParse.mockReturnValue({
      function_name: 'unknown',
      chain_id: 1,
    });

    mockHandleNetworkSwitch.mockRejectedValue(mockError);

    await handleEthereumUrl({ deeplinkManager, url, origin });

    expect(spyAlert).toHaveBeenCalledWith(
      'send.network_not_found_title',
      'send.network_not_found_description',
    );
  });

  it('shows an alert when approval process fails', async () => {
    const url = 'ethereum:approve';
    const origin = 'test_origin';
    const mockError = new Error('Approval process failed');
    const spyAlert = jest.spyOn(Alert, 'alert');

    mockParse.mockReturnValue({
      function_name: ETH_ACTIONS.APPROVE,
      chain_id: 1,
      parameters: {},
    });

    mockApproveTransaction.mockImplementation(() => {
      throw mockError;
    });

    await handleEthereumUrl({ deeplinkManager, url, origin });

    expect(spyAlert).toHaveBeenCalledWith(
      'send.network_not_found_title',
      'send.network_not_found_description',
    );
  });

  it('shows alert when there are missing or incomplete parameters in URL for TRANSFER action', async () => {
    const url = 'ethereum:transfer';
    const origin = 'test_origin';

    mockParse.mockReturnValue({
      function_name: ETH_ACTIONS.TRANSFER,
      chain_id: 1,
      parameters: {},
    });

    await handleEthereumUrl({ deeplinkManager, url, origin });

    expect(deeplinkManager.navigation.navigate).toHaveBeenCalledWith(
      'SendView',
      expect.any(Object), // The exact expectations here depend on the intended behavior
    );
  });

  it('switches to mainnet when isEvmSelected is false', async () => {
    const url = 'ethereum:transfer';
    const origin = 'test_origin';
    const mockSetActiveNetwork = jest.fn();

    mockParse.mockReturnValue({
      function_name: ETH_ACTIONS.TRANSFER,
      chain_id: 1,
      parameters: {},
    });

    // Override the mock for this specific test
    const mockState = Engine.context.MultichainNetworkController.state as {
      isEvmSelected: boolean;
    };
    mockState.isEvmSelected = false;
    Engine.context.MultichainNetworkController.setActiveNetwork =
      mockSetActiveNetwork;

    await handleEthereumUrl({ deeplinkManager, url, origin });

    expect(mockRequestApproval).toHaveBeenCalledWith({
      currentNetworkName: 'Solana',
      networkName: 'Ethereum Mainnet',
    });
    expect(mockSetActiveNetwork).toHaveBeenCalledWith(MAINNET);
  });

  it.each([true, false])(
    'does not leave a non-EVM network when the user declines (redesigned: %s)',
    async (redesigned) => {
      mockIsDeeplinkRedesignedConfirmationCompatible.mockReturnValue(
        redesigned,
      );
      mockParse.mockReturnValue({
        function_name: ETH_ACTIONS.TRANSFER,
        chain_id: 1,
        parameters: {},
      });
      (
        Engine.context.MultichainNetworkController.state as {
          isEvmSelected: boolean;
        }
      ).isEvmSelected = false;
      const mockSetActiveNetwork = jest.fn();
      Engine.context.MultichainNetworkController.setActiveNetwork =
        mockSetActiveNetwork;
      mockRequestApproval.mockResolvedValue(false);

      await handleEthereumUrl({
        deeplinkManager,
        url: 'ethereum:transfer',
        origin: 'test_origin',
      });

      expect(mockSetActiveNetwork).not.toHaveBeenCalled();
      expect(mockAddTransactionForDeeplink).not.toHaveBeenCalled();
      expect(mockHandleNetworkSwitch).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    },
  );
  describe('from a non-EVM network', () => {
    const url = 'ethereum:0x0000000000000000000000000000000000000001@59144';
    const origin = 'test_origin';
    let mockSetActiveNetwork: jest.Mock;

    beforeEach(() => {
      (
        Engine.context.MultichainNetworkController.state as {
          isEvmSelected: boolean;
        }
      ).isEvmSelected = false;
      mockSetActiveNetwork = jest.fn();
      Engine.context.MultichainNetworkController.setActiveNetwork =
        mockSetActiveNetwork;
      mockParse.mockReturnValue({
        chain_id: '59144',
        parameters: { value: '1' },
      });
    });

    it('asks once for the requested network and switches straight to it', async () => {
      await handleEthereumUrl({ deeplinkManager, url, origin });

      expect(mockRequestApproval).toHaveBeenCalledTimes(1);
      expect(mockRequestApproval).toHaveBeenCalledWith({
        currentNetworkName: 'Solana',
        networkName: 'Linea',
      });
      expect(mockUtilHandleNetworkSwitch).toHaveBeenCalledWith('0xe708');
      expect(mockSetActiveNetwork).not.toHaveBeenCalled();
      expect(mockHandleNetworkSwitch).not.toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('SendView', expect.any(Object));
    });

    it('leaves the non-EVM network selected when the user declines', async () => {
      mockRequestApproval.mockResolvedValue(false);

      await handleEthereumUrl({ deeplinkManager, url, origin });

      expect(mockUtilHandleNetworkSwitch).not.toHaveBeenCalled();
      expect(mockSetActiveNetwork).not.toHaveBeenCalled();
      expect(mockHandleNetworkSwitch).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('does not switch or prompt for an unconfigured network', async () => {
      mockParse.mockReturnValue({ chain_id: '999', parameters: {} });

      await handleEthereumUrl({ deeplinkManager, url, origin });

      expect(mockRequestApproval).not.toHaveBeenCalled();
      expect(mockUtilHandleNetworkSwitch).not.toHaveBeenCalled();
      expect(mockSetActiveNetwork).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('network switch consent', () => {
    const url = 'ethereum:0x0000000000000000000000000000000000000001@59144';
    const origin = 'test_origin';

    beforeEach(() => {
      (
        Engine.context.MultichainNetworkController.state as {
          isEvmSelected: boolean;
        }
      ).isEvmSelected = true;
      Engine.context.MultichainNetworkController.setActiveNetwork = jest.fn();
    });

    it.each([
      ['send', { chain_id: '59144', parameters: { value: '1' } }],
      ['transfer', { function_name: ETH_ACTIONS.TRANSFER, chain_id: '59144' }],
      [
        'approve',
        {
          function_name: ETH_ACTIONS.APPROVE,
          chain_id: '59144',
          parameters: {},
        },
      ],
    ])(
      'does not navigate or switch the network when the user declines (%s)',
      async (_, parsed) => {
        mockParse.mockReturnValue(parsed);
        mockHandleNetworkSwitch.mockResolvedValue(false);

        await handleEthereumUrl({ deeplinkManager, url, origin });

        expect(mockHandleNetworkSwitch).toHaveBeenCalledWith('59144');
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(mockApproveTransaction).not.toHaveBeenCalled();
        expect(
          Engine.context.MultichainNetworkController.setActiveNetwork,
        ).not.toHaveBeenCalled();
        expect(
          Engine.context.NetworkController.setProviderType,
        ).not.toHaveBeenCalled();
      },
    );

    it('waits for the network switch decision before opening the send flow', async () => {
      let resolveSwitch: (approved: boolean) => void = () => undefined;
      mockParse.mockReturnValue({
        chain_id: '59144',
        parameters: { value: '1' },
      });
      mockHandleNetworkSwitch.mockReturnValue(
        new Promise<boolean>((resolve) => {
          resolveSwitch = resolve;
        }),
      );

      const pending = handleEthereumUrl({ deeplinkManager, url, origin });
      await Promise.resolve();
      expect(mockNavigate).not.toHaveBeenCalled();

      resolveSwitch(true);
      await pending;

      expect(mockNavigate).toHaveBeenCalledWith('SendView', expect.any(Object));
    });

    it('does not switch the global network for redesigned confirmations', async () => {
      mockIsDeeplinkRedesignedConfirmationCompatible.mockReturnValue(true);
      mockParse.mockReturnValue({
        function_name: ETH_ACTIONS.TRANSFER,
        chain_id: '59144',
      });

      await handleEthereumUrl({ deeplinkManager, url, origin });

      expect(mockAddTransactionForDeeplink).toHaveBeenCalled();
      expect(mockHandleNetworkSwitch).not.toHaveBeenCalled();
      expect(
        Engine.context.MultichainNetworkController.setActiveNetwork,
      ).not.toHaveBeenCalled();
      expect(
        Engine.context.NetworkController.setProviderType,
      ).not.toHaveBeenCalled();
    });
  });
});
