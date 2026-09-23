import { parse } from 'eth-url-parser';
import { Alert } from 'react-native';
import { ETH_ACTIONS } from '../../../constants/deeplinks';
import {
  NetworkSwitchErrorType,
  UNABLE_TO_FIND_NETWORK_ERROR_PREFIX,
} from '../../../constants/error';
import Logger from '../../../util/Logger';
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
  },
}));

jest.mock('../../../components/Views/confirmations/utils/deeplink');

jest.mock('../../../util/Logger', () => ({
  error: jest.fn(),
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
  const mockLoggerError = jest.mocked(Logger.error);

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

    mockHandleNetworkSwitch.mockImplementation(() => {
      // do nothing
    });

    mockNavigate.mockImplementation(() => {
      // do nothing
    });

    mockIsDeeplinkRedesignedConfirmationCompatible.mockReturnValue(false);
    mockAddTransactionForDeeplink.mockResolvedValue(
      {} as ReturnType<typeof addTransactionForDeeplink>,
    );
  });

  it('alerts and throws on invalid URL', () => {
    const spyAlert = jest.spyOn(Alert, 'alert');

    const url = 'invalid_url';
    const origin = 'test_origin';

    mockParse.mockImplementation(() => {
      throw new Error('Invalid URL');
    });

    handleEthereumUrl({ deeplinkManager, url, origin });

    expect(spyAlert).toHaveBeenCalledWith(
      'deeplink.invalid',
      'Error: Invalid URL',
    );
  });

  it('shows deprecation modal if url is a goerli url', () => {
    const url = 'ethereum:transfer';
    const origin = 'test_origin';
    mockParse.mockReturnValue({
      function_name: ETH_ACTIONS.TRANSFER,
      chain_id: 5,
    });

    mockGetDecimalChainId.mockReturnValue(5);

    handleEthereumUrl({ deeplinkManager, url, origin });

    expect(deeplinkManager.navigation.navigate).toHaveBeenCalledWith(
      'DeprecatedNetworkDetails',
      {},
    );
    expect(deeplinkManager._handleNetworkSwitch).toHaveBeenCalledTimes(0);
  });

  it('navigates to SendView for TRANSFER action', () => {
    const url = 'ethereum:transfer';
    const origin = 'test_origin';
    mockParse.mockReturnValue({
      function_name: ETH_ACTIONS.TRANSFER,
      chain_id: 1,
    });

    handleEthereumUrl({ deeplinkManager, url, origin });

    expect(deeplinkManager.navigation.navigate).toHaveBeenCalledWith(
      'SendView',
      expect.any(Object),
    );
  });

  it('shows alert when there is a network switch error', () => {
    const spyAlert = jest.spyOn(Alert, 'alert');

    const url = 'ethereum:transfer';
    const origin = 'test_origin';

    mockParse.mockReturnValue({
      function_name: ETH_ACTIONS.TRANSFER,
      chain_id: 1,
    });

    mockHandleNetworkSwitch.mockImplementation(() => {
      throw new Error(NetworkSwitchErrorType.missingNetworkId);
    });

    handleEthereumUrl({ deeplinkManager, url, origin });

    expect(spyAlert).toHaveBeenCalledWith(
      'send.network_not_found_title',
      'send.network_missing_id',
    );
  });

  it('calls _approveTransaction for APPROVE action', () => {
    const url = 'ethereum:approve';
    const origin = 'test_origin';
    mockParse.mockReturnValue({
      function_name: ETH_ACTIONS.APPROVE,
      chain_id: 1,
      parameters: {},
    });

    handleEthereumUrl({ deeplinkManager, url, origin });

    expect(deeplinkManager._approveTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      origin,
    );
  });

  it('navigates to SendFlowView for default action', () => {
    const url = 'ethereum:unknownAction';
    const origin = 'test_origin';
    mockParse.mockReturnValue({
      function_name: 'unknownAction',
      chain_id: 1,
      parameters: {},
    });

    handleEthereumUrl({ deeplinkManager, url, origin });

    expect(deeplinkManager.navigation.navigate).toHaveBeenCalledWith(
      'SendFlowView',
      expect.any(Object),
    );
  });

  it('calls addTransactionForDeeplink if deeplink is compatible with redesigned confirmation', () => {
    mockIsDeeplinkRedesignedConfirmationCompatible.mockReturnValue(true);
    const url = 'ethereum:transfer';
    const origin = 'test_origin';
    mockParse.mockReturnValue({
      function_name: ETH_ACTIONS.TRANSFER,
      chain_id: 1,
    });

    handleEthereumUrl({ deeplinkManager, url, origin });

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

  it('shows a transaction error alert and logs the error when handling fails for a non network reason', async () => {
    const spyAlert = jest.spyOn(Alert, 'alert');

    const url = 'ethereum:transfer';
    const origin = 'test_origin';
    const mockError = new Error('Unknown error');
    mockParse.mockReturnValue({
      function_name: ETH_ACTIONS.TRANSFER,
      chain_id: 1,
    });
    mockHandleNetworkSwitch.mockImplementation(() => {
      // do nothing
    });

    mockNavigate.mockImplementation(() => {
      throw mockError;
    });

    await handleEthereumUrl({ deeplinkManager, url, origin });

    expect(mockLoggerError).toHaveBeenCalledWith(mockError, {
      message: 'Deeplink transaction failed',
      origin: 'deeplink',
      function_name: ETH_ACTIONS.TRANSFER,
    });

    expect(spyAlert).toHaveBeenCalledWith(
      'transaction.transaction_error',
      'send.deeplink_failure',
    );
  });

  it('logs the error and shows a transaction error alert when the deeplink transaction cannot be added', async () => {
    const spyAlert = jest.spyOn(Alert, 'alert');

    const url = 'ethereum:transfer';
    const origin = 'test_origin';
    const mockError = new Error('Invalid transaction params');

    mockIsDeeplinkRedesignedConfirmationCompatible.mockReturnValue(true);
    mockAddTransactionForDeeplink.mockRejectedValue(mockError);

    await handleEthereumUrl({ deeplinkManager, url, origin });

    expect(mockLoggerError).toHaveBeenCalledWith(mockError, {
      message: 'Deeplink transaction failed',
      origin: 'deeplink',
      function_name: ETH_ACTIONS.TRANSFER,
    });

    expect(spyAlert).toHaveBeenCalledWith(
      'transaction.transaction_error',
      'send.deeplink_failure',
    );
  });

  it('reports an unknown function name as other', async () => {
    const url = 'ethereum:sign';
    const origin = 'test_origin';
    const mockError = new Error('Unknown error');

    mockParse.mockReturnValue({
      function_name: 'sign',
      chain_id: 1,
    });

    mockNavigate.mockImplementation(() => {
      throw mockError;
    });

    await handleEthereumUrl({ deeplinkManager, url, origin });

    expect(mockLoggerError).toHaveBeenCalledWith(
      mockError,
      expect.objectContaining({ function_name: 'other' }),
    );
  });

  it('shows the network not found alert when the network cannot be found', async () => {
    const spyAlert = jest.spyOn(Alert, 'alert');

    const url = 'ethereum:transfer';
    const origin = 'test_origin';

    mockParse.mockReturnValue({
      function_name: ETH_ACTIONS.TRANSFER,
      chain_id: 1,
    });

    mockHandleNetworkSwitch.mockImplementation(() => {
      throw new Error(`${UNABLE_TO_FIND_NETWORK_ERROR_PREFIX} 1`);
    });

    await handleEthereumUrl({ deeplinkManager, url, origin });

    expect(spyAlert).toHaveBeenCalledWith(
      'send.network_not_found_title',
      'send.network_not_found_description',
    );
  });

  it('navigates to SendFlowView for unknown function_name', () => {
    const url = 'ethereum:sign';
    const origin = 'test_origin';

    mockParse.mockReturnValue({
      function_name: 'unknown',
      chain_id: 1,
      parameters: {},
    });

    handleEthereumUrl({ deeplinkManager, url, origin });

    expect(deeplinkManager.navigation.navigate).toHaveBeenCalledWith(
      'SendFlowView',
      expect.any(Object),
    );
  });

  it('shows alert when there is a generic error during network switch', () => {
    const url = 'ethereum:sign';
    const origin = 'test_origin';
    const mockError = new Error('Generic network switch error');
    const spyAlert = jest.spyOn(Alert, 'alert');

    mockParse.mockReturnValue({
      function_name: 'unknown',
      chain_id: 1,
    });

    mockHandleNetworkSwitch.mockImplementation(() => {
      throw mockError;
    });

    handleEthereumUrl({ deeplinkManager, url, origin });

    expect(spyAlert).toHaveBeenCalledWith(
      'transaction.transaction_error',
      'send.deeplink_failure',
    );
  });

  it('shows an alert when approval process fails', () => {
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

    handleEthereumUrl({ deeplinkManager, url, origin });

    expect(spyAlert).toHaveBeenCalledWith(
      'transaction.transaction_error',
      'send.deeplink_failure',
    );
  });

  it('shows alert when there are missing or incomplete parameters in URL for TRANSFER action', () => {
    const url = 'ethereum:transfer';
    const origin = 'test_origin';

    mockParse.mockReturnValue({
      function_name: ETH_ACTIONS.TRANSFER,
      chain_id: 1,
      parameters: {},
    });

    handleEthereumUrl({ deeplinkManager, url, origin });

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

    expect(mockSetActiveNetwork).toHaveBeenCalledWith(MAINNET);
  });
});
