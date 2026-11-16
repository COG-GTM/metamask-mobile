import React from 'react';
import { ConnectedComponent } from 'react-redux';
import { Hex } from '@metamask/utils';
import { merge, mergeWith } from 'lodash';
import { fireEvent, act, waitFor } from '@testing-library/react-native';

import QuotesView, { gasLimitWithMultiplier } from './QuotesView';
import {
  DeepPartial,
  renderScreen,
} from '../../../util/test/renderWithProvider';
import { backgroundState } from '../../../util/test/initial-root-state';
import { RootState } from '../../../reducers';
import {
  MOCK_ACCOUNTS_CONTROLLER_STATE,
  MOCK_ADDRESS_2,
} from '../../../util/test/accountsControllerTestUtils';
import { SwapsViewSelectors } from '../../../../e2e/selectors/swaps/SwapsView.selectors';
import Engine from '../../../core/Engine';
import { RpcEndpointType } from '@metamask/network-controller';
import { selectShouldUseSmartTransaction } from '../../../selectors/smartTransactionsController';
import { useSwapsSmartTransaction } from './utils/useSwapsSmartTransaction';
import { query } from '@metamask/controller-utils';
import { TransactionStatus } from '@metamask/transaction-controller';
import { isHardwareAccount } from '../../../util/address';

jest.mock('../../../util/address', () => ({
  ...jest.requireActual('../../../util/address'),
  isHardwareAccount: jest.fn(),
}));

const mockQuotesModal = jest.fn();
jest.mock('./components/QuotesModal', () => {
  const { createElement } = jest.requireActual('react');
  const ActualQuotesModal = jest.requireActual(
    './components/QuotesModal',
  ).default;
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => {
      mockQuotesModal(props);
      return createElement(ActualQuotesModal, props);
    },
  };
});

jest.mock('../../../util/networks/global-network', () => ({
  ...jest.requireActual('../../../util/networks/global-network'),
  getGlobalEthQuery: jest.fn(),
}));

jest.mock('@metamask/controller-utils', () => ({
  ...jest.requireActual('@metamask/controller-utils'),
  query: jest.fn(),
}));

jest.mock('./utils/useSwapsSmartTransaction', () => {
  const actual = jest.requireActual('./utils/useSwapsSmartTransaction');
  return {
    ...actual,
    useSwapsSmartTransaction: jest.fn(actual.useSwapsSmartTransaction),
  };
});

jest.mock('../../../../app/selectors/smartTransactionsController', () => ({
  ...jest.requireActual(
    '../../../../app/selectors/smartTransactionsController',
  ),
  selectShouldUseSmartTransaction: jest.fn(),
  selectSmartTransactionsForCurrentChain: () => [
    {
      status: 'pending',
      uuid: 'mock-uuid-123',
      creationTime: Date.now(),
    },
  ],
}));

const mockSubmitSignedTransactions = jest
  .fn()
  .mockResolvedValue({ uuid: 'mock-uuid-123' });
const mockUpdateSmartTransaction = jest.fn();
const mockSubscribeOnceIf = jest.fn();
jest.mock('../../../core/Engine', () => ({
  controllerMessenger: {
    subscribeOnceIf: (...args: unknown[]) => mockSubscribeOnceIf(...args),
  },
  context: {
    SwapsController: {
      stopPollingAndResetState: jest.fn(),
      startFetchAndSetQuotes: jest.fn(),
    },
    TransactionController: {
      estimateGasFee: jest.fn(),
      approveTransactionsWithSameNonce: jest.fn(() => ['asd']),
      update: jest.fn(),
      addTransaction: jest.fn(),
    },
    KeyringController: {
      state: {
        keyrings: [
          {
            accounts: ['0xC4966c0D659D99699BFD7EB54D8fafEE40e4a756'],
          },
        ],
      },
    },
    SmartTransactionsController: {
      getFees: jest.fn(),
      submitSignedTransactions: mockSubmitSignedTransactions,
      updateSmartTransaction: mockUpdateSmartTransaction,
    },
    GasFeeController: {
      getGasFeeEstimatesAndStartPolling: jest.fn(),
    },
    TokensController: {
      addToken: jest.fn(),
      state: {
        allTokens: {
          '0x1': {},
        },
      },
    },
  },
}));

// Mock Fox component to avoid unnecessary snapshots
jest.mock('../../../components/UI/Fox', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('./components/LoadingAnimation', () => ({
  __esModule: true,
  default: ({ onAnimationEnd }: { onAnimationEnd?: () => void }) => {
    if (onAnimationEnd) {
      onAnimationEnd();
    }
    return null;
  },
}));

const destinationToken = '0x987654321';
const sourceToken = '0x123456';
const accountBalance = '0x654321';
const selectedAddress = MOCK_ADDRESS_2;
const normalizedSelectedAddress = selectedAddress.toLowerCase();
const mockChainId = '0x1';
const topAggIdMock = 'topAggId';
const quotesMock = {
  [topAggIdMock]: {
    aggType: 'RFQ',
    aggregator: topAggIdMock,
    approvalNeeded: null,
    averageGas: 0,
    destinationAmount: '5',
    destinationToken,
    destinationTokenRate: 1,
    error: null,
    estimatedRefund: 0,
    fee: 0,
    fetchTime: 0,
    gasEstimate: '0x3d7a3',
    gasEstimateWithRefund: '0x3d7a3',
    gasMultiplier: 1,
    hasRoute: false,
    isGasIncludedTrade: false,
    maxGas: 0,
    priceSlippage: {
      bucket: 'low',
      calculationError: '',
      destinationAmountInETH: 0,
      destinationAmountInNativeCurrency: 0,
      destinationAmountInUSD: 0,
      ratio: 1,
      sourceAmountInETH: 0,
      sourceAmountInNativeCurrency: 0,
      sourceAmountInUSD: 0,
    },
    quoteRefreshSeconds: 30,
    slippage: 2,
    sourceAmount: '5',
    sourceToken,
    sourceTokenRate: 1,
    trade: {
      data: 'TRADE TX',
      from: selectedAddress,
      gas: '0x3d7a3',
      to: '0x881d40237659c251811cec9c364ef91dc08d300c',
      value: '0x5af3107a4000',
    },
    tradeTxFees: {
      baseFeePerGas: 14028013812,
      feeEstimate: 3050341159721301,
      fees: [],
      gasLimit: '0x3d7a3',
      maxFeeEstimate: 5910045890298291,
    },
  },
};
const quoteValuesMock = {
  [topAggIdMock]: {
    aggregator: topAggIdMock,
    ethFee: '0.002910246604106472',
    ethValueOfTokens: '0.000098654753332117',
    maxEthFee: '0.007649129721886653',
    metaMaskFeeInEth: '0.000000870849020586',
    overallValueOfQuote: '-0.002811591850774355',
    tradeGasLimit: '202989',
    tradeMaxGasLimit: '251823',
  },
};
const usedGasEstimateMock = {
  baseFeeTrend: 'down',
  estimatedBaseFee: '12.457753087',
  high: {
    maxWaitTimeEstimate: 30000,
    minWaitTimeEstimate: 15000,
    suggestedMaxFeePerGas: '30.671253777',
    suggestedMaxPriorityFeePerGas: '2.018421676',
  },
  historicalBaseFeeRange: ['9.994725452', '15.517624473'],
  historicalPriorityFeeRange: ['0.005', '82.668725682'],
  latestPriorityFeeRange: ['0.058', '3'],
  low: {
    maxWaitTimeEstimate: 60000,
    minWaitTimeEstimate: 15000,
    suggestedMaxFeePerGas: '12.467059087',
    suggestedMaxPriorityFeePerGas: '0.009306',
  },
  medium: {
    maxWaitTimeEstimate: 45000,
    minWaitTimeEstimate: 15000,
    suggestedMaxFeePerGas: '19.515724976',
    suggestedMaxPriorityFeePerGas: '1.701138061',
  },
  networkCongestion: 0.58865,
  priorityFeeTrend: 'level',
};

const mockInitialState: DeepPartial<RootState> = {
  engine: {
    backgroundState: {
      ...backgroundState,
      AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
      AccountTrackerController: {
        accountsByChainId: {
          '0x1': {
            [selectedAddress]: {
              balance: accountBalance,
            },
          },
        },
      },
      TokenBalancesController: {
        tokenBalances: {
          [normalizedSelectedAddress as Hex]: {
            [mockChainId]: {
              [sourceToken]: '0x5',
            },
          },
        },
      },
      SwapsController: {
        quotesLastFetched: 123,
        quoteRefreshSeconds: 30,
        topAggId: topAggIdMock,
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        quotes: quotesMock as any,
        quoteValues: quoteValuesMock,
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        usedGasEstimate: usedGasEstimateMock as any,
        approvalTransaction: {
          data: '0x123456',
        },
      },
      NetworkController: {
        selectedNetworkClientId: 'mainnet',
        networksMetadata: {
          mainnet: {
            EIPS: {
              1559: true,
            },
          },
        },
        networkConfigurationsByChainId: {
          '0x1': {
            blockExplorerUrls: [],
            chainId: '0x1',
            defaultRpcEndpointIndex: 0,
            name: 'Ethereum Mainnet',
            nativeCurrency: 'ETH',
            rpcEndpoints: [
              {
                name: 'Ethereum Mainnet',
                networkClientId: 'mainnet',
                type: RpcEndpointType.Infura,
                url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
              },
            ],
          },
        },
      },
    },
  },
  settings: {},
  transaction: {},
  fiatOrders: {},
};

function render(
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: React.ComponentType | ConnectedComponent<any, any>,
  modifiedState?: DeepPartial<RootState>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paramsOverrides: Record<string, any> = {},
) {
  return renderScreen(
    Component,
    {
      name: 'QuotesView',
    },
    {
      state: modifiedState ?? mockInitialState,
    },
    {
      sourceAmount: '5',
      tokens: [
        {
          address: sourceToken,
          symbol: 'DAI',
        },
        {
          address: destinationToken,
          symbol: 'USDC',
        },
      ],
      sourceTokenAddress: sourceToken,
      destinationTokenAddress: destinationToken,
      ...paramsOverrides,
    },
  );
}

describe('QuotesView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render quote screen', async () => {
    const wrapper = render(QuotesView, mockInitialState);
    expect(wrapper).toMatchSnapshot();

    expect(
      wrapper.findByTestId(SwapsViewSelectors.QUOTE_SUMMARY),
    ).toBeDefined();
  });

  describe('should use TransactionController estimations for EIP1559 networks', () => {
    it('for approval transactions', async () => {
      const wrapper = render(QuotesView, mockInitialState);

      const swapButton = await wrapper.findByTestId(
        SwapsViewSelectors.SWAP_BUTTON,
      );

      fireEvent.press(swapButton);

      const estimateGasFeeSpy = jest.spyOn(
        Engine.context.TransactionController,
        'estimateGasFee',
      );

      expect(estimateGasFeeSpy).toHaveBeenCalled();
    });

    it('for trade transactions', async () => {
      const state = merge(mockInitialState, {
        engine: {
          backgroundState: {
            SwapsController: {
              approvalTransaction: null,
            },
          },
        },
      });
      const wrapper = render(QuotesView, state);

      const swapButton = await wrapper.findByTestId(
        SwapsViewSelectors.SWAP_BUTTON,
      );

      fireEvent.press(swapButton);

      const estimateGasFeeSpy = jest.spyOn(
        Engine.context.TransactionController,
        'estimateGasFee',
      );

      expect(estimateGasFeeSpy).toHaveBeenCalled();
    });
  });

  describe('Smart Transactions', () => {
    const state = merge({}, mockInitialState);

    it('should use Smart Transactions when enabled', async () => {
      const mockSubmitSwapsSmartTransaction = jest.fn().mockResolvedValue({
        approvalTxUuid: 'approval-uuid-123',
        tradeTxUuid: 'trade-uuid-456',
      });
      (useSwapsSmartTransaction as jest.Mock).mockReturnValue({
        submitSwapsSmartTransaction: mockSubmitSwapsSmartTransaction,
      });
      jest.mocked(selectShouldUseSmartTransaction).mockReturnValue(true);
      jest.mocked(query).mockResolvedValueOnce(123).mockResolvedValueOnce({
        timestamp: 1234,
      });

      const wrapper = render(QuotesView, state);

      const swapButton = await wrapper.findByTestId(
        SwapsViewSelectors.SWAP_BUTTON,
      );

      fireEvent.press(swapButton);

      // Verify submitSwapsSmartTransaction was called
      expect(mockSubmitSwapsSmartTransaction).toHaveBeenCalled();
    });

    it('should not use Smart Transactions when disabled', async () => {
      const mockSubmitSwapsSmartTransaction = jest.fn().mockResolvedValue({
        approvalTxUuid: undefined,
        tradeTxUuid: 'trade-uuid-456',
      });
      (useSwapsSmartTransaction as jest.Mock).mockReturnValue({
        submitSwapsSmartTransaction: mockSubmitSwapsSmartTransaction,
      });

      jest.mocked(selectShouldUseSmartTransaction).mockReturnValue(false);
      const wrapper = render(QuotesView, state);

      const swapButton = await wrapper.findByTestId(
        SwapsViewSelectors.SWAP_BUTTON,
      );

      fireEvent.press(swapButton);

      // Verify submitSwapsSmartTransaction was not called
      expect(mockSubmitSwapsSmartTransaction).not.toHaveBeenCalled();
    });
  });

  it('should call addToken in TokensController', async () => {
    const state = merge({}, mockInitialState);
    jest.mocked(query).mockResolvedValueOnce(123).mockResolvedValueOnce({
      timestamp: 1234,
    });
    jest
      .spyOn(Engine.context.TransactionController, 'addTransaction')
      .mockResolvedValue({
        result: Promise.resolve('mock-tx-hash'),
        transactionMeta: {
          id: 'mock-id',
          networkClientId: 'mock-network-id',
          time: Date.now(),
          chainId: '0x1',
          status: 'submitted' as TransactionStatus,
          txParams: {
            from: '0x0',
            to: '0x1',
            value: '0x0',
            gas: '0x0',
            gasPrice: '0x0',
          },
        },
      });
    const spy = jest.spyOn(Engine.context.TokensController, 'addToken');

    const wrapper = render(QuotesView, state);

    const swapButton = await wrapper.findByTestId(
      SwapsViewSelectors.SWAP_BUTTON,
    );

    act(() => {
      fireEvent.press(swapButton);
    });

    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
    });
  });
});

const ONE_ETH_HEX = '0xde0b6b3a7640000';
const HALF_CENT_ETH_HEX = '0x11c37937e08000'; // 0.005 ETH
const NATIVE_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';
const APPROVAL_DATA =
  '0x095ea7b3' +
  '000000000000000000000000881d40237659c251811cec9c364ef91dc08d300c' +
  '00000000000000000000000000000000000000000000000000000000000003e8';

const buildQuote = (
  aggregator: string,
  overrides: Record<string, unknown> = {},
) => ({
  ...quotesMock[topAggIdMock],
  aggregator,
  ...overrides,
});

const buildQuoteValue = (
  aggregator: string,
  overrides: Record<string, unknown> = {},
) => ({
  ...quoteValuesMock[topAggIdMock],
  aggregator,
  ...overrides,
});

const REPLACED_KEYS = ['quotes', 'quoteValues', 'approvalTransaction'];

function buildState({
  swaps = {},
  ethBalance = accountBalance,
  sourceTokenBalance = '0x5',
}: {
  swaps?: Record<string, unknown>;
  ethBalance?: string;
  sourceTokenBalance?: string;
} = {}): DeepPartial<RootState> {
  return mergeWith(
    {},
    mockInitialState,
    {
      engine: {
        backgroundState: {
          AccountTrackerController: {
            accountsByChainId: {
              '0x1': { [selectedAddress]: { balance: ethBalance } },
            },
          },
          TokenBalancesController: {
            tokenBalances: {
              [normalizedSelectedAddress]: {
                [mockChainId]: { [sourceToken]: sourceTokenBalance },
              },
            },
          },
          SwapsController: {
            approvalTransaction: null,
            ...swaps,
          },
        },
      },
    },
    (_objValue: unknown, srcValue: unknown, key: string) =>
      REPLACED_KEYS.includes(key) ? srcValue : undefined,
  );
}

const lastQuotesModalProps = () =>
  mockQuotesModal.mock.calls[mockQuotesModal.mock.calls.length - 1][0];

describe('gasLimitWithMultiplier', () => {
  it('multiplies the gas limit and rounds to an integer', () => {
    expect(gasLimitWithMultiplier('0x3d7a3', 1)?.toString(10)).toBe('251811');
    expect(gasLimitWithMultiplier('100000', 1.5)?.toString(10)).toBe('150000');
    expect(gasLimitWithMultiplier('100001', 1.5)?.toString(10)).toBe('150002');
  });

  it('returns undefined when the gas limit or multiplier is missing', () => {
    expect(
      gasLimitWithMultiplier(undefined as unknown as string, 1.5),
    ).toBeUndefined();
    expect(
      gasLimitWithMultiplier('100000', undefined as unknown as number),
    ).toBeUndefined();
    expect(gasLimitWithMultiplier('100000', 0)).toBeUndefined();
  });
});

describe('QuotesView quote ordering, balances and hardware approvals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isHardwareAccount).mockReturnValue(false);
    jest.mocked(selectShouldUseSmartTransaction).mockReturnValue(false);
  });

  describe('quote ordering', () => {
    it('orders by destinationAmount and breaks ties by lower ethFee when there is no conversion rate', async () => {
      const state = buildState({
        ethBalance: ONE_ETH_HEX,
        swaps: {
          topAggId: 'aggHighFee',
          quotes: {
            aggHighFee: buildQuote('aggHighFee', {
              destinationAmount: '10',
              destinationTokenRate: null,
            }),
            aggLowFee: buildQuote('aggLowFee', {
              destinationAmount: '10',
              destinationTokenRate: null,
            }),
            aggMostTokens: buildQuote('aggMostTokens', {
              destinationAmount: '12',
              destinationTokenRate: null,
            }),
          },
          quoteValues: {
            aggHighFee: buildQuoteValue('aggHighFee', {
              ethFee: '0.003',
              overallValueOfQuote: '100',
            }),
            aggLowFee: buildQuoteValue('aggLowFee', {
              ethFee: '0.001',
              overallValueOfQuote: '-100',
            }),
            aggMostTokens: buildQuoteValue('aggMostTokens', {
              ethFee: '0.01',
              overallValueOfQuote: '-200',
            }),
          },
        },
      });

      const { findByText } = render(QuotesView, state);

      expect(await findByText('3 quotes')).toBeOnTheScreen();
      const { quotes, selectedQuote, showOverallValue } =
        lastQuotesModalProps();
      expect(quotes.map((q: { aggregator: string }) => q.aggregator)).toEqual([
        'aggMostTokens',
        'aggLowFee',
        'aggHighFee',
      ]);
      expect(showOverallValue).toBe(false);
      expect(selectedQuote).toBe('aggHighFee');
    });

    it('orders by overallValueOfQuote descending when a conversion rate is available', async () => {
      const state = buildState({
        ethBalance: ONE_ETH_HEX,
        swaps: {
          topAggId: 'aggBest',
          quotes: {
            aggWorst: buildQuote('aggWorst', { destinationAmount: '30' }),
            aggBest: buildQuote('aggBest', { destinationAmount: '10' }),
            aggMiddle: buildQuote('aggMiddle', { destinationAmount: '20' }),
          },
          quoteValues: {
            aggWorst: buildQuoteValue('aggWorst', {
              overallValueOfQuote: '-0.01',
            }),
            aggBest: buildQuoteValue('aggBest', {
              overallValueOfQuote: '0.02',
            }),
            aggMiddle: buildQuoteValue('aggMiddle', {
              overallValueOfQuote: '0.005',
            }),
          },
        },
      });

      const { findByText } = render(QuotesView, state);

      expect(await findByText('3 quotes')).toBeOnTheScreen();
      const { quotes, selectedQuote, showOverallValue } =
        lastQuotesModalProps();
      expect(quotes.map((q: { aggregator: string }) => q.aggregator)).toEqual([
        'aggBest',
        'aggMiddle',
        'aggWorst',
      ]);
      expect(showOverallValue).toBe(true);
      expect(selectedQuote).toBe('aggBest');
    });
  });

  describe('balance sufficiency', () => {
    it('shows the missing token amount when the source amount exceeds the token balance', async () => {
      const state = buildState({
        ethBalance: ONE_ETH_HEX,
        sourceTokenBalance: '0x2',
      });

      const { findByText, queryByText } = render(QuotesView, state, {
        tokens: [
          { address: sourceToken, symbol: 'DAI', decimals: 0 },
          { address: destinationToken, symbol: 'USDC', decimals: 0 },
        ],
      });

      expect(await findByText('3 DAI')).toBeOnTheScreen();
      expect(
        await findByText(/more to complete this swap\./),
      ).toBeOnTheScreen();
      expect(queryByText(/more for gas to complete this swap\./)).toBeNull();
    });

    it('shows the missing ETH when the ETH balance is below maxEthFee', async () => {
      // 0.007649129721886653 ETH (maxEthFee) - 0.005 ETH (balance) = 0.002649...
      const state = buildState({ ethBalance: HALF_CENT_ETH_HEX });

      const { findByText, queryByText } = render(QuotesView, state);

      expect(await findByText('0.00265 ETH')).toBeOnTheScreen();
      expect(
        await findByText(/more for gas to complete this swap\./),
      ).toBeOnTheScreen();
      expect(queryByText(/more to complete this swap\./)).toBeNull();
    });

    it('includes the native source amount in the ETH requirement', async () => {
      // balance == source amount (1 ETH), so the missing amount is exactly maxEthFee
      const state = buildState({ ethBalance: ONE_ETH_HEX });

      const { findByText } = render(QuotesView, state, {
        sourceAmount: '1000000000000000000',
        sourceTokenAddress: NATIVE_TOKEN_ADDRESS,
        tokens: [
          { address: NATIVE_TOKEN_ADDRESS, symbol: 'ETH', decimals: 18 },
          { address: destinationToken, symbol: 'USDC', decimals: 18 },
        ],
      });

      expect(await findByText('0.00765 ETH')).toBeOnTheScreen();
      expect(
        await findByText(/more for gas to complete this swap\./),
      ).toBeOnTheScreen();
    });

    it('hides the insufficient balance banner when balances cover amount and fees', async () => {
      const state = buildState({ ethBalance: ONE_ETH_HEX });

      const { findByTestId, queryByText } = render(QuotesView, state);

      expect(
        await findByTestId(SwapsViewSelectors.SWAP_BUTTON),
      ).toBeOnTheScreen();
      expect(queryByText(/more for gas to complete this swap\./)).toBeNull();
      expect(queryByText(/more to complete this swap\./)).toBeNull();
    });

    it('does not require ETH for gas on gas-included swaps', async () => {
      const state = buildState({
        ethBalance: HALF_CENT_ETH_HEX,
        swaps: {
          quotes: {
            [topAggIdMock]: buildQuote(topAggIdMock, {
              isGasIncludedTrade: true,
              tradeTxFees: {
                ...quotesMock[topAggIdMock].tradeTxFees,
                fees: [{ tokenFees: [{ balanceNeededToken: '0x1' }] }],
              },
            }),
          },
          quoteValues: quoteValuesMock,
        },
      });

      const { findByText, queryByText } = render(QuotesView, state);

      expect(await findByText('Included', { exact: false })).toBeOnTheScreen();
      expect(queryByText(/more for gas to complete this swap\./)).toBeNull();
      expect(queryByText('0.00265 ETH')).toBeNull();
    });
  });

  it('renders the slippage ratio as a percentage', async () => {
    const state = buildState({
      ethBalance: ONE_ETH_HEX,
      swaps: {
        quotes: {
          [topAggIdMock]: buildQuote(topAggIdMock, {
            priceSlippage: {
              ...quotesMock[topAggIdMock].priceSlippage,
              bucket: 'medium',
              ratio: 1.0525,
            },
          }),
        },
        quoteValues: quoteValuesMock,
      },
    });

    const { findByText } = render(QuotesView, state);

    expect(await findByText('Price difference of ~5.25%')).toBeOnTheScreen();
  });

  describe('hardware wallet approval chaining', () => {
    const approvalTxId = 'approval-tx-id';
    const tradeTxId = 'trade-tx-id';

    beforeEach(() => {
      jest.mocked(query).mockReset();
      jest
        .mocked(Engine.context.TransactionController.addTransaction)
        .mockReset();
    });

    const mockTransactionMeta = (id: string) => ({
      result: Promise.resolve(`${id}-hash`),
      transactionMeta: {
        id,
        networkClientId: 'mainnet',
        time: Date.now(),
        chainId: '0x1' as Hex,
        status: TransactionStatus.submitted,
        txParams: { from: selectedAddress },
      },
    });

    const swapState = () =>
      buildState({
        ethBalance: ONE_ETH_HEX,
        swaps: { approvalTransaction: { data: APPROVAL_DATA } },
      });

    const pressSwap = async () => {
      jest.mocked(query).mockResolvedValueOnce(123).mockResolvedValueOnce({
        timestamp: 1234,
      });
      const addTransactionSpy = jest
        .spyOn(Engine.context.TransactionController, 'addTransaction')
        .mockResolvedValueOnce(mockTransactionMeta(approvalTxId))
        .mockResolvedValueOnce(mockTransactionMeta(tradeTxId));

      const wrapper = render(QuotesView, swapState());
      const swapButton = await wrapper.findByTestId(
        SwapsViewSelectors.SWAP_BUTTON,
      );
      act(() => {
        fireEvent.press(swapButton);
      });
      return addTransactionSpy;
    };

    const getSubscription = async () => {
      await waitFor(() => expect(mockSubscribeOnceIf).toHaveBeenCalledTimes(1));
      const [eventName, handler, filter] = mockSubscribeOnceIf.mock.calls[0];
      return { eventName, handler, filter };
    };

    it('submits the trade only after the approval is confirmed', async () => {
      jest.mocked(isHardwareAccount).mockReturnValue(true);
      const addTransactionSpy = await pressSwap();

      const { eventName, handler, filter } = await getSubscription();

      expect(eventName).toBe('TransactionController:transactionConfirmed');
      expect(filter({ id: approvalTxId })).toBe(true);
      expect(filter({ id: 'some-other-tx' })).toBe(false);

      expect(addTransactionSpy).toHaveBeenCalledTimes(1);
      expect(addTransactionSpy.mock.calls[0][0]).toEqual(
        expect.objectContaining({ data: APPROVAL_DATA }),
      );

      await act(async () => {
        await handler({
          id: approvalTxId,
          status: TransactionStatus.confirmed,
        });
      });

      await waitFor(() => expect(addTransactionSpy).toHaveBeenCalledTimes(2));
      expect(addTransactionSpy.mock.calls[1][0]).toEqual(
        expect.objectContaining({
          data: quotesMock[topAggIdMock].trade.data,
          to: quotesMock[topAggIdMock].trade.to,
        }),
      );
    });

    it('does not submit the trade when the approval did not confirm', async () => {
      jest.mocked(isHardwareAccount).mockReturnValue(true);
      const addTransactionSpy = await pressSwap();

      const { handler } = await getSubscription();

      await act(async () => {
        await handler({ id: approvalTxId, status: TransactionStatus.failed });
      });

      expect(addTransactionSpy).toHaveBeenCalledTimes(1);
      expect(addTransactionSpy.mock.calls[0][0]).toEqual(
        expect.objectContaining({ data: APPROVAL_DATA }),
      );
    });

    it('submits approval and trade back to back for software accounts', async () => {
      const addTransactionSpy = await pressSwap();

      await waitFor(() => expect(addTransactionSpy).toHaveBeenCalledTimes(2));
      expect(mockSubscribeOnceIf).not.toHaveBeenCalled();
      expect(addTransactionSpy.mock.calls[0][0]).toEqual(
        expect.objectContaining({ data: APPROVAL_DATA }),
      );
      expect(addTransactionSpy.mock.calls[1][0]).toEqual(
        expect.objectContaining({ data: quotesMock[topAggIdMock].trade.data }),
      );
    });
  });
});
