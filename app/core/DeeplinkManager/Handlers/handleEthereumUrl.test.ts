import { parse } from 'eth-url-parser';
import { Alert } from 'react-native';
import { ETH_ACTIONS } from '../../../constants/deeplinks';
import { NetworkSwitchErrorType } from '../../../constants/error';
import DeeplinkManager from '../DeeplinkManager';
import handleEthereumUrl from './handleEthereumUrl';
import { getDecimalChainId } from '../../../util/networks';
import Engine from '../../Engine';
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
  },
}));

jest.mock('../../../components/Views/confirmations/utils/deeplink');

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

  describe('network switch confirmation', () => {
    const mockSetActiveNetwork = jest.mocked(
      Engine.context.MultichainNetworkController.setActiveNetwork,
    );
    const multichainState = Engine.context.MultichainNetworkController
      .state as { isEvmSelected: boolean };

    afterEach(() => {
      multichainState.isEvmSelected = true;
    });

    it('requests the link chain through the confirmed switch and never sets the network directly', async () => {
      mockParse.mockReturnValue({
        function_name: ETH_ACTIONS.TRANSFER,
        chain_id: '137',
        parameters: {},
      });

      await handleEthereumUrl({
        deeplinkManager,
        url: 'ethereum:0x1@137',
        origin: 'test_origin',
      });

      expect(mockHandleNetworkSwitch).toHaveBeenCalledWith('137');
      expect(mockSetActiveNetwork).not.toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('SendView', expect.any(Object));
    });

    it('stops without navigating or approving when the user declines the switch', async () => {
      mockHandleNetworkSwitch.mockResolvedValue(false);

      for (const function_name of [
        ETH_ACTIONS.TRANSFER,
        ETH_ACTIONS.APPROVE,
        'unknown',
      ]) {
        mockParse.mockReturnValue({
          function_name,
          chain_id: '137',
          parameters: { value: '1' },
        });

        await handleEthereumUrl({
          deeplinkManager,
          url: 'ethereum:0x1@137',
          origin: 'test_origin',
        });
      }

      expect(mockHandleNetworkSwitch).toHaveBeenCalledTimes(3);
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockApproveTransaction).not.toHaveBeenCalled();
      expect(mockSetActiveNetwork).not.toHaveBeenCalled();
    });

    it('asks to switch to mainnet when a non-EVM network is selected and the link has no chain', async () => {
      multichainState.isEvmSelected = false;
      mockParse.mockReturnValue({
        function_name: ETH_ACTIONS.TRANSFER,
        parameters: {},
      });

      await handleEthereumUrl({
        deeplinkManager,
        url: 'ethereum:0x1',
        origin: 'test_origin',
      });

      expect(mockHandleNetworkSwitch).toHaveBeenCalledWith('1');
      expect(mockSetActiveNetwork).not.toHaveBeenCalled();
    });

    it('does not change the network for redesigned confirmations when an EVM network is selected', async () => {
      mockIsDeeplinkRedesignedConfirmationCompatible.mockReturnValue(true);
      mockParse.mockReturnValue({
        function_name: ETH_ACTIONS.TRANSFER,
        chain_id: '137',
      });

      await handleEthereumUrl({
        deeplinkManager,
        url: 'ethereum:0x1@137',
        origin: 'test_origin',
      });

      expect(mockHandleNetworkSwitch).not.toHaveBeenCalled();
      expect(mockSetActiveNetwork).not.toHaveBeenCalled();
      expect(mockAddTransactionForDeeplink).toHaveBeenCalled();
    });

    it('asks before leaving a non-EVM network for redesigned confirmations', async () => {
      multichainState.isEvmSelected = false;
      mockIsDeeplinkRedesignedConfirmationCompatible.mockReturnValue(true);
      mockParse.mockReturnValue({
        function_name: ETH_ACTIONS.TRANSFER,
        chain_id: '137',
      });

      await handleEthereumUrl({
        deeplinkManager,
        url: 'ethereum:0x1@137',
        origin: 'test_origin',
      });

      expect(mockHandleNetworkSwitch).toHaveBeenCalledWith('1');
      expect(mockSetActiveNetwork).not.toHaveBeenCalled();
      expect(mockAddTransactionForDeeplink).toHaveBeenCalled();
    });

    it('does not add the redesigned transaction when the user declines leaving a non-EVM network', async () => {
      multichainState.isEvmSelected = false;
      mockHandleNetworkSwitch.mockResolvedValue(false);
      mockIsDeeplinkRedesignedConfirmationCompatible.mockReturnValue(true);
      mockParse.mockReturnValue({
        function_name: ETH_ACTIONS.TRANSFER,
        chain_id: '137',
      });

      await handleEthereumUrl({
        deeplinkManager,
        url: 'ethereum:0x1@137',
        origin: 'test_origin',
      });

      expect(mockAddTransactionForDeeplink).not.toHaveBeenCalled();
      expect(mockSetActiveNetwork).not.toHaveBeenCalled();
    });
  });
});
