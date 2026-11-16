import { CHAIN_IDS } from '@metamask/transaction-controller';
import Send from '.';
import { RootState } from '../../../../../reducers';
import { MOCK_KEYRING_CONTROLLER } from '../../../../../selectors/keyringController/testUtils';
import {
  MOCK_ACCOUNTS_CONTROLLER_STATE,
  MOCK_ADDRESS_2,
} from '../../../../../util/test/accountsControllerTestUtils';
import { mockNetworkState } from '../../../../../util/test/network';
import {
  DeepPartial,
  renderScreen,
} from '../../../../../util/test/renderWithProvider';
import { SolScope } from '@metamask/keyring-api';
import { waitFor } from '@testing-library/react-native';
import { getAddress } from '../../../../../util/address';
import { setTransactionObject } from '../../../../../actions/transaction';
import { showAlert } from '../../../../../actions/alert';
import Engine from '../../../../../core/Engine';

jest.mock('../SendFlow/Confirm', () => () => null);

jest.mock('../../../../../util/address', () => ({
  ...jest.requireActual('../../../../../util/address'),
  getAddress: jest.fn(),
}));

jest.mock('../../../../../actions/transaction', () => {
  const actual = jest.requireActual('../../../../../actions/transaction');
  return {
    ...actual,
    setTransactionObject: jest.fn(actual.setTransactionObject),
  };
});

jest.mock('../../../../../actions/alert', () => {
  const actual = jest.requireActual('../../../../../actions/alert');
  return { ...actual, showAlert: jest.fn(actual.showAlert) };
});

const mockedNetworkControllerState = mockNetworkState({
  chainId: CHAIN_IDS.MAINNET,
  id: 'mainnet',
  nickname: 'Ethereum Mainnet',
  ticker: 'ETH',
});

const initialState: DeepPartial<RootState> = {
  transaction: {
    transaction: {
      value: '',
      data: '0x0',
      from: MOCK_ADDRESS_2,
      gas: '',
      gasPrice: '',
      to: '0x2',
    },
    selectedAsset: { symbol: 'ETH' },
    assetType: undefined,
  },
  settings: {},
  engine: {
    backgroundState: {
      AccountTrackerController: {
        accountsByChainId: {
          64: {
            [MOCK_ADDRESS_2]: {
              balance: '0x0',
            },
          },
          1: {
            [MOCK_ADDRESS_2]: {
              balance: '0x0',
            },
          },
        },
      },
      AddressBookController: {
        addressBook: {},
      },
      TokenBalancesController: {
        tokenBalances: {},
      },
      TokenListController: {
        tokensChainsCache: {
          '0x1': {},
        },
      },
      PreferencesController: {
        featureFlags: {},
        ipfsGateway: 'https://dweb.link/ipfs/',
        lostIdentities: {},
        selectedAddress: MOCK_ADDRESS_2,
        useTokenDetection: true,
        useNftDetection: false,
        displayNftMedia: true,
        useSafeChainsListValidation: false,
        isMultiAccountBalancesEnabled: true,
        showTestNetworks: true,
        showIncomingTransactions: {
          '0x1': true,
          '0x5': true,
          '0x38': true,
          '0x61': true,
          '0xa': true,
          '0xa869': true,
          '0x89': true,
          '0x13881': true,
          '0xa86a': true,
          '0xfa': true,
          '0xfa2': true,
          '0xaa36a7': true,
          '0xe704': true,
          '0xe708': true,
          '0x504': true,
          '0x507': true,
          '0x505': true,
          '0x64': true,
        },
      },
      AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
      KeyringController: MOCK_KEYRING_CONTROLLER,
      NetworkController: {
        ...mockedNetworkControllerState,
      },
      NftController: {
        allNftContracts: {},
      },
      TokenRatesController: {
        marketData: {},
      },
      TransactionController: {
        methodData: {},
        transactions: [],
      },
      SmartTransactionsController: {
        smartTransactionsState: {
          liveness: true,
        },
      },
      GasFeeController: {
        gasFeeEstimates: {},
        estimatedGasFeeTimeBounds: {},
        gasEstimateType: 'none',
      },
      MultichainNetworkController: {
        isEvmSelected: true,
        selectedMultichainNetworkChainId: SolScope.Mainnet,
        multichainNetworkConfigurationsByChainId: {},
      },
    },
  },
};

jest.mock('../../../../../core/Engine', () => {
  const { MOCK_ACCOUNTS_CONTROLLER_STATE: mockAccountsControllerState } =
    jest.requireActual('../../../../../util/test/accountsControllerTestUtils');
  return {
    rejectPendingApproval: jest.fn(),
    context: {
      PreferencesController: {
        state: {
          securityAlertsEnabled: false,
        },
      },
      TokensController: {
        addToken: jest.fn(),
      },
      AssetsContractController: {
        getERC20TokenDecimals: jest.fn(),
        getERC721AssetSymbol: jest.fn(),
      },
      KeyringController: {
        state: {
          keyrings: [
            {
              accounts: ['0xC4966c0D659D99699BFD7EB54D8fafEE40e4a756'],
              index: 0,
              type: 'HD Key Tree',
            },
          ],
        },
      },
      TransactionController: {
        estimateGas: jest.fn().mockImplementation(({ gas }) => {
          if (gas === undefined) return Promise.resolve({ gas: '0x5208' });
          return Promise.resolve({ gas });
        }),
        addTransaction: jest.fn().mockResolvedValue({
          result: {},
          transactionMeta: {
            id: 1,
          },
        }),
      },
      GasFeeController: {
        stopPolling: jest.fn(),
        getGasFeeEstimatesAndStartPolling: jest
          .fn()
          .mockResolvedValue('poll-token'),
      },
      NetworkController: {
        getProviderAndBlockTracker: jest.fn().mockImplementation(() => ({
          provider: {
            sendAsync: () => null,
          },
        })),
        getNetworkClientById: () => ({
          configuration: {
            chainId: '0x1',
            rpcUrl: 'https://mainnet.infura.io/v3',
            ticker: 'ETH',
            type: 'custom',
          },
        }),
        state: {
          ...mockedNetworkControllerState,
        },
      },
      AccountsController: {
        ...mockAccountsControllerState,
        state: mockAccountsControllerState,
      },
    },
  };
});

describe('Accounts', () => {
  it('should render correctly', () => {
    const { toJSON } = renderScreen(
      Send,
      { name: 'Send' },
      { state: initialState },
    );
    expect(toJSON()).toMatchSnapshot();
  });
});

describe('Send payment request deeplinks', () => {
  const RECIPIENT = '0x8e23ee67d1332ad560396262c48ffbb01f93d052';
  const TOKEN_ADDRESS = '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7';
  const TRANSFER_SELECTOR = '0xa9059cbb';

  const mockGetAddress = getAddress as jest.MockedFunction<typeof getAddress>;
  const mockSetTransactionObject = setTransactionObject as jest.Mock;
  const mockShowAlert = showAlert as jest.Mock;
  const { AssetsContractController } = Engine.context as unknown as {
    AssetsContractController: {
      getERC20TokenDecimals: jest.Mock;
      getERC721AssetSymbol: jest.Mock;
    };
  };

  const renderWithTxMeta = (txMeta: Record<string, unknown>) =>
    renderScreen(
      Send,
      { name: 'Send' },
      { state: initialState },
      { txMeta: { source: 'ethereum:test', ...txMeta } },
    );

  const getPaymentRequestTxMeta = async () => {
    await waitFor(() =>
      expect(
        mockSetTransactionObject.mock.calls.find(([tx]) => tx?.paymentRequest),
      ).toBeDefined(),
    );
    return mockSetTransactionObject.mock.calls.find(
      ([tx]) => tx?.paymentRequest,
    )[0];
  };

  // transfer(address,uint256): 4-byte selector + two 32-byte words
  const decodeTransfer = (data: string) => ({
    selector: data.slice(0, 10),
    toAddress: `0x${data.slice(34, 74)}`,
    amount: BigInt(`0x${data.slice(74, 138)}`).toString(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAddress.mockImplementation(async (recipient) => recipient);
    AssetsContractController.getERC20TokenDecimals.mockResolvedValue('18');
    AssetsContractController.getERC721AssetSymbol.mockResolvedValue('TST');
  });

  it('builds a send-eth transaction with hex value and readable ETH amount', async () => {
    renderWithTxMeta({
      action: 'send-eth',
      target_address: RECIPIENT,
      parameters: { value: '2014000000000000000' },
    });

    const txMeta = await getPaymentRequestTxMeta();
    expect(txMeta).toMatchObject({
      assetType: 'ETH',
      paymentRequest: true,
      selectedAsset: { symbol: 'ETH', isETH: true },
      to: RECIPIENT,
      transactionTo: RECIPIENT,
      value: '0x1bf32a5451a30000',
      transactionValue: '0x1bf32a5451a30000',
      readableValue: '2.014',
      from: MOCK_ADDRESS_2,
    });
  });

  it('builds a send-token transfer encoding uint256 and using token decimals', async () => {
    renderWithTxMeta({
      action: 'send-token',
      target_address: TOKEN_ADDRESS,
      parameters: { address: RECIPIENT, uint256: '1500000000000000000' },
    });

    const txMeta = await getPaymentRequestTxMeta();
    expect(txMeta).toMatchObject({
      assetType: 'ERC20',
      paymentRequest: true,
      to: TOKEN_ADDRESS,
      transactionTo: RECIPIENT,
      value: '0x0',
      readableValue: '1.5',
      selectedAsset: { address: TOKEN_ADDRESS, decimals: 18, symbol: 'TST' },
    });
    expect(decodeTransfer(txMeta.data)).toEqual({
      selector: TRANSFER_SELECTOR,
      toAddress: RECIPIENT,
      amount: '1500000000000000000',
    });
  });

  it('keeps the exact amount for large scientific-notation uint256 values', async () => {
    AssetsContractController.getERC20TokenDecimals.mockResolvedValue('6');
    renderWithTxMeta({
      action: 'send-token',
      target_address: TOKEN_ADDRESS,
      parameters: {
        address: RECIPIENT,
        uint256: '1.23456789012345678901234e+23',
      },
    });

    const txMeta = await getPaymentRequestTxMeta();
    expect(decodeTransfer(txMeta.data).amount).toBe('123456789012345678901234');
    expect(txMeta.readableValue).toBe('123456789012345678.901234');
  });

  it('builds a zero-amount transfer when uint256 is missing', async () => {
    renderWithTxMeta({
      action: 'send-token',
      target_address: TOKEN_ADDRESS,
      parameters: { address: RECIPIENT },
    });

    const txMeta = await getPaymentRequestTxMeta();
    expect(txMeta.readableValue).toBe('0');
    expect(decodeTransfer(txMeta.data).amount).toBe('0');
  });

  it('uses the deeplink gasPrice (not gas) for gasPrice', async () => {
    renderWithTxMeta({
      action: 'send-eth',
      target_address: RECIPIENT,
      parameters: { value: '1', gas: '21000', gasPrice: '1000000000' },
    });

    const txMeta = await getPaymentRequestTxMeta();
    expect(txMeta.gas.toString()).toBe('21000');
    expect(txMeta.gasPrice.toString()).toBe('1000000000');
  });

  it('does not build a transaction when the recipient cannot be resolved', async () => {
    mockGetAddress.mockResolvedValue(undefined as unknown as string);
    renderWithTxMeta({
      action: 'send-token',
      target_address: TOKEN_ADDRESS,
      parameters: { address: 'unknown.eth', uint256: '1' },
    });

    await waitFor(() => expect(mockGetAddress).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(
      mockSetTransactionObject.mock.calls.find(([tx]) => tx?.paymentRequest),
    ).toBeUndefined();
  });

  it.each([
    ['fractional uint256', { address: RECIPIENT, uint256: '1.5' }],
    ['negative uint256', { address: RECIPIENT, uint256: '-1' }],
  ])('rejects a send-token deeplink with %s', async (_label, parameters) => {
    renderWithTxMeta({
      action: 'send-token',
      target_address: TOKEN_ADDRESS,
      parameters,
    });

    await waitFor(() => expect(mockShowAlert).toHaveBeenCalled());
    expect(
      mockSetTransactionObject.mock.calls.find(([tx]) => tx?.paymentRequest),
    ).toBeUndefined();
  });

  it('rejects a send-token deeplink when token decimals cannot be read', async () => {
    AssetsContractController.getERC20TokenDecimals.mockRejectedValue(
      new Error('not a token'),
    );
    renderWithTxMeta({
      action: 'send-token',
      target_address: TOKEN_ADDRESS,
      parameters: { address: RECIPIENT, uint256: '1' },
    });

    await waitFor(() => expect(mockShowAlert).toHaveBeenCalledTimes(1));
    expect(mockGetAddress).not.toHaveBeenCalled();
    expect(
      mockSetTransactionObject.mock.calls.find(([tx]) => tx?.paymentRequest),
    ).toBeUndefined();
  });
});
