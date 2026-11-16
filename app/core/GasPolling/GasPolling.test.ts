import { GAS_ESTIMATE_TYPES } from '@metamask/gas-fee-controller';
import BN4 from 'bnjs4';
import Engine from '../Engine';
import {
  startGasPolling,
  getEIP1559TransactionData,
  stopGasPolling,
  useDataStore,
  useGasTransaction,
} from './GasPolling';
import {
  parseTransactionEIP1559,
  parseTransactionLegacy,
} from '../../util/transactions';
import {
  GasFeeOptions,
  GetEIP1559TransactionDataProps,
  UseGasTransactionProps,
} from './types';
import AppConstants from '../AppConstants';
import { Hex } from '@metamask/utils';
import { renderHookWithProvider } from '../../util/test/renderWithProvider';
import { backgroundState } from '../../util/test/initial-root-state';
jest.mock('../../util/transactions');
const mockedParseTransactionEIP1559 =
  parseTransactionEIP1559 as jest.MockedFunction<
    typeof parseTransactionEIP1559
  >;
const mockedParseTransactionLegacy =
  parseTransactionLegacy as jest.MockedFunction<typeof parseTransactionLegacy>;

const tokenValue = 'fba4a030-e1f5-11ec-a660-87ece4ac6cf7';

jest.mock('../Engine', () => ({
  context: {
    GasFeeController: {
      gasFeeEstimates: {},
      gasEstimateType: '',
      getGasFeeEstimatesAndStartPolling: jest.fn(() => tokenValue),
      stopPolling: jest.fn(),
    },
  },
}));

const suggestedGasLimit = '0x123';
const selectedOption = 'medium';
const gas = {
  maxWaitTimeEstimate: 45000,
  minWaitTimeEstimate: 15000,
  suggestedMaxFeePerGas: '1.500000018',
  suggestedMaxPriorityFeePerGas: '1.5',
  selectedOption,
};
const gasFeeEstimates: GasFeeOptions = {
  estimatedBaseFee: null,
  gasFeeEstimates: {
    baseFeeTrend: 'down',
    estimatedBaseFee: '0.000000013',
    high: {
      maxWaitTimeEstimate: 60000,
      minWaitTimeEstimate: 15000,
      suggestedMaxFeePerGas: '2.450000023',
      suggestedMaxPriorityFeePerGas: '2.45',
    },
    historicalBaseFeeRange: ['0.000000009', '0.000000014'],
    historicalPriorityFeeRange: ['1', '96'],
    latestPriorityFeeRange: ['1.5', '2.999999783'],
    low: {
      maxWaitTimeEstimate: 30000,
      minWaitTimeEstimate: 15000,
      suggestedMaxFeePerGas: '1.410000013',
      suggestedMaxPriorityFeePerGas: '1.41',
    },
    medium: {
      maxWaitTimeEstimate: 45000,
      minWaitTimeEstimate: 15000,
      suggestedMaxFeePerGas: '1.500000018',
      suggestedMaxPriorityFeePerGas: '1.5',
    },
    networkCongestion: 0.4713,
    priorityFeeTrend: 'level',
  },
};
const contractExchangeRates = {};
const conversionRate = 1844.31;
const currentCurrency = 'USD';
const nativeCurrency = 'ETH';
const transactionState = {
  selectedAsset: {
    address: '',
    isETH: true,
    logo: '../images/eth-logo-new.png',
    name: 'Ether',
    symbol: 'ETH',
  },
  transaction: {
    value: '0xde0b6b3a7640000',
    data: undefined,
  },
};

describe('GasPolling', () => {
  const token = undefined;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { GasFeeController }: any = Engine.context;
  it('should call the start gas polling controller', async () => {
    await startGasPolling(token);
    expect(
      GasFeeController.getGasFeeEstimatesAndStartPolling,
    ).toHaveBeenCalled();
  });

  it('should return a token value when called', async () => {
    const pollToken = await startGasPolling(token);
    expect(pollToken).toEqual(tokenValue);
  });

  it('should stop polling when stopGasPolling is called', async () => {
    await stopGasPolling();
    expect(GasFeeController.stopPolling).toHaveBeenCalled();
  });
});

describe('GetEIP1559TransactionData', () => {
  const transactionData: GetEIP1559TransactionDataProps = {
    suggestedGasLimit,
    gas,
    gasFeeEstimates,
    transactionState,
    contractExchangeRates,
    conversionRate,
    currentCurrency,
    nativeCurrency,
  };

  it('should fail when incomplete props is passed for ', async () => {
    const incompleteTransactionData: Partial<GetEIP1559TransactionDataProps> = {
      suggestedGasLimit,
      gas,
      gasFeeEstimates,
      transactionState,
      contractExchangeRates,
      conversionRate,
      currentCurrency,
    };

    try {
      const result = getEIP1559TransactionData(
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        incompleteTransactionData as any,
      );
      expect(result).toEqual('Incomplete data for EIP1559 transaction');
      expect(mockedParseTransactionEIP1559).not.toHaveBeenCalled();
    } catch (error) {
      return expect(error).toBeTruthy();
    }
  });

  it('should get the transaction data for EIP1559', () => {
    const expected = {
      estimatedBaseFee: '0.000000013',
      estimatedBaseFeeHex: 'd',
      gasFeeMaxConversion: '0.09',
      gasFeeMaxNative: '0.00005',
      gasFeeMinConversion: '0.09',
      gasFeeMinNative: '0.00005',
      gasLimitHex: '0x8163' as Hex,
      gasFeeMaxHex: '0x01',
      maxPriorityFeeConversion: '0.09',
      maxPriorityFeeNative: '0.00005',
      renderableGasFeeMaxConversion: '$0.09',
      renderableGasFeeMaxNative: '0.00005 ETH',
      renderableGasFeeMinConversion: '$0.09',
      renderableGasFeeMinNative: '0.00005 ETH',
      renderableMaxFeePerGasConversion: '$0.09',
      renderableMaxFeePerGasNative: '0.00005 ETH',
      renderableMaxPriorityFeeConversion: '$0.09',
      renderableMaxPriorityFeeNative: '0.00005 ETH',
      renderableTotalMaxConversion: '$1,844.40',
      renderableTotalMaxNative: '1.00005 ETH',
      renderableTotalMinConversion: '$1,844.40',
      renderableTotalMinNative: '1.00005 ETH',
      suggestedGasLimit: '0x123',
      suggestedMaxFeePerGas: '1.500000018',
      suggestedMaxFeePerGasHex: '59682f12',
      suggestedMaxPriorityFeePerGas: '1.5',
      suggestedMaxPriorityFeePerGasHex: '59682f00',
      timeEstimate: 'Likely in < 30 seconds',
      timeEstimateColor: 'green',
      timeEstimateId: AppConstants.GAS_TIMES.LIKELY,
      totalMaxConversion: '1844.4',
      totalMaxHex: 'de0e3e3ba6645f6',
      totalMaxNative: '1.00005',
      totalMinConversion: '1844.4',
      totalMinHex: 'de0e3e3ba63bf07',
      totalMinNative: '1.00006',
    };

    mockedParseTransactionEIP1559.mockReturnValue(expected);

    const result = getEIP1559TransactionData(transactionData);
    expect(mockedParseTransactionEIP1559).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it('returns the parse error message when parsing throws', () => {
    mockedParseTransactionEIP1559.mockImplementationOnce(() => {
      throw new Error('parse failure');
    });

    const result = getEIP1559TransactionData(transactionData);

    expect(mockedParseTransactionEIP1559).toHaveBeenCalled();
    expect(result).toEqual('Error parsing transaction data');
  });
});

const legacyGasFeeEstimates = { low: '10', medium: '15', high: '20' };

const buildState = ({
  gasEstimateType,
  estimates,
  transaction = {},
}: {
  gasEstimateType: string;
  estimates: Record<string, unknown>;
  transaction?: Record<string, unknown>;
}) => ({
  engine: {
    backgroundState: {
      ...backgroundState,
      GasFeeController: {
        ...backgroundState.GasFeeController,
        gasEstimateType,
        gasFeeEstimates: estimates,
      },
      CurrencyRateController: {
        currentCurrency,
        currencyRates: {
          ETH: {
            conversionDate: 0,
            conversionRate,
            usdConversionRate: null,
          },
        },
      },
    },
  },
  transaction: {
    selectedAsset: transactionState.selectedAsset,
    transaction: {
      ...transactionState.transaction,
      gas: new BN4('21000'),
      ...transaction,
    },
  },
  settings: { showCustomNonce: true },
});

const renderUseGasTransaction = (
  props: UseGasTransactionProps,
  state: ReturnType<typeof buildState>,
) =>
  renderHookWithProvider(() => useGasTransaction(props), {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state: state as any,
  });

const selectedGasFeeOf = (mockFn: jest.Mock) =>
  (mockFn.mock.calls[0][0] as { selectedGasFee: Record<string, unknown> })
    .selectedGasFee;
const legacySelectedGasFee = () =>
  selectedGasFeeOf(mockedParseTransactionLegacy as unknown as jest.Mock);
const eip1559SelectedGasFee = () =>
  selectedGasFeeOf(mockedParseTransactionEIP1559 as unknown as jest.Mock);

describe('useDataStore', () => {
  it('returns the data store values from redux state', () => {
    const state = buildState({
      gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET,
      estimates: gasFeeEstimates.gasFeeEstimates,
    });

    const { result } = renderHookWithProvider(() => useDataStore(), {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      state: state as any,
    });

    expect(result.current.conversionRate).toEqual(conversionRate);
    expect(result.current.currentCurrency).toEqual(currentCurrency);
    expect(result.current.gasEstimateType).toEqual(
      GAS_ESTIMATE_TYPES.FEE_MARKET,
    );
    expect(result.current.gasFeeEstimates).toEqual(
      gasFeeEstimates.gasFeeEstimates,
    );
    expect(result.current.ticker).toEqual('ETH');
    expect(result.current.showCustomNonce).toBe(true);
    expect(result.current.transactionState).toEqual(state.transaction);
    expect(result.current.selectedAsset).toEqual(
      transactionState.selectedAsset,
    );
  });
});

describe('useGasTransaction', () => {
  const parsedResult = { parsed: true };

  beforeEach(() => {
    mockedParseTransactionLegacy.mockReset();
    mockedParseTransactionEIP1559.mockReset();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedParseTransactionLegacy.mockReturnValue(parsedResult as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedParseTransactionEIP1559.mockReturnValue(parsedResult as any);
  });

  describe('legacy transactions', () => {
    it('uses gasObjectLegacy price and legacyGasLimit for FEE_MARKET networks', () => {
      const { result } = renderUseGasTransaction(
        {
          legacy: true,
          onlyGas: true,
          multiLayerL1FeeTotal: '0x10',
          gasObject: {
            suggestedGasLimit: '30000',
            suggestedMaxFeePerGas: '1',
            suggestedMaxPriorityFeePerGas: '1',
          },
          gasObjectLegacy: { suggestedGasPrice: '25', legacyGasLimit: '50000' },
        },
        buildState({
          gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET,
          estimates: gasFeeEstimates.gasFeeEstimates,
        }),
      );

      expect(result.current).toBe(parsedResult);
      expect(mockedParseTransactionEIP1559).not.toHaveBeenCalled();
      expect(mockedParseTransactionLegacy).toHaveBeenCalledWith(
        expect.objectContaining({
          conversionRate,
          currentCurrency,
          ticker: 'ETH',
          multiLayerL1FeeTotal: '0x10',
          selectedGasFee: {
            suggestedGasLimit: '50000',
            suggestedGasPrice: '25',
          },
        }),
        { onlyGas: true },
      );
    });

    it('does not fall back to low/gasPrice estimates for FEE_MARKET networks', () => {
      renderUseGasTransaction(
        { legacy: true },
        buildState({
          gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET,
          estimates: { ...gasFeeEstimates.gasFeeEstimates, gasPrice: '99' },
          transaction: { gasPrice: new BN4('20000000000') },
        }),
      );

      expect(legacySelectedGasFee()).toEqual({
        suggestedGasLimit: '21000',
        suggestedGasPrice: undefined,
      });
    });

    it('converts a BN transaction gasPrice to gwei on LEGACY networks', () => {
      renderUseGasTransaction(
        { legacy: true },
        buildState({
          gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
          estimates: legacyGasFeeEstimates,
          transaction: { gasPrice: new BN4('20000000000') },
        }),
      );

      expect(legacySelectedGasFee()).toEqual({
        suggestedGasLimit: '21000',
        suggestedGasPrice: '20',
      });
    });

    it('prefers gasObjectLegacy price over a BN transaction gasPrice', () => {
      renderUseGasTransaction(
        { legacy: true, gasObjectLegacy: { suggestedGasPrice: '42' } },
        buildState({
          gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
          estimates: legacyGasFeeEstimates,
          transaction: { gasPrice: new BN4('20000000000') },
        }),
      );

      expect(legacySelectedGasFee().suggestedGasPrice).toEqual('42');
    });

    it('uses gasFeeEstimates.gasPrice when the transaction gasPrice is not a BN', () => {
      renderUseGasTransaction(
        { legacy: true },
        buildState({
          gasEstimateType: GAS_ESTIMATE_TYPES.ETH_GASPRICE,
          estimates: { gasPrice: '12' },
          transaction: { gasPrice: '0x4a817c800' },
        }),
      );

      expect(legacySelectedGasFee()).toEqual({
        suggestedGasLimit: '21000',
        suggestedGasPrice: '12',
      });
    });

    it('prefers gasObjectLegacy price over gasFeeEstimates.gasPrice', () => {
      renderUseGasTransaction(
        { legacy: true, gasObjectLegacy: { suggestedGasPrice: '7' } },
        buildState({
          gasEstimateType: GAS_ESTIMATE_TYPES.ETH_GASPRICE,
          estimates: { gasPrice: '12' },
        }),
      );

      expect(legacySelectedGasFee().suggestedGasPrice).toEqual('7');
    });

    it('gives legacyGasLimit precedence over gasObject and transaction gas', () => {
      const gasObject = {
        suggestedGasLimit: '30000',
        suggestedMaxFeePerGas: '1',
        suggestedMaxPriorityFeePerGas: '1',
      };
      const state = buildState({
        gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
        estimates: legacyGasFeeEstimates,
      });

      renderUseGasTransaction(
        {
          legacy: true,
          gasObject,
          gasObjectLegacy: { legacyGasLimit: '50000' },
        },
        state,
      );
      expect(legacySelectedGasFee().suggestedGasLimit).toEqual('50000');

      mockedParseTransactionLegacy.mockClear();
      renderUseGasTransaction({ legacy: true, gasObject }, state);
      expect(legacySelectedGasFee().suggestedGasLimit).toEqual('30000');

      mockedParseTransactionLegacy.mockClear();
      renderUseGasTransaction({ legacy: true }, state);
      expect(legacySelectedGasFee().suggestedGasLimit).toEqual('21000');
    });
  });

  describe('EIP-1559 transactions', () => {
    it('spreads gasFeeEstimates[gasSelected] when a gas option is selected', () => {
      const { result } = renderUseGasTransaction(
        {
          gasSelected: 'high',
          onlyGas: true,
          gasObject: {
            suggestedGasLimit: '30000',
            suggestedMaxFeePerGas: '9',
            suggestedMaxPriorityFeePerGas: '8',
          },
        },
        buildState({
          gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET,
          estimates: gasFeeEstimates.gasFeeEstimates,
        }),
      );

      expect(result.current).toBe(parsedResult);
      expect(mockedParseTransactionLegacy).not.toHaveBeenCalled();
      expect(mockedParseTransactionEIP1559).toHaveBeenCalledWith(
        expect.objectContaining({
          conversionRate,
          currentCurrency,
          nativeCurrency: 'ETH',
          gasFeeEstimates: gasFeeEstimates.gasFeeEstimates,
        }),
        { onlyGas: true },
      );
      expect(eip1559SelectedGasFee()).toEqual({
        ...gasFeeEstimates.gasFeeEstimates.high,
        suggestedGasLimit: '30000',
        selectedOption: 'high',
        estimatedBaseFee: '0.000000013',
      });
    });

    it('uses gasObject fees when no gas option is selected', () => {
      renderUseGasTransaction(
        {
          gasSelected: null,
          gasObject: {
            suggestedGasLimit: '30000',
            suggestedMaxFeePerGas: '9',
            suggestedMaxPriorityFeePerGas: '8',
          },
        },
        buildState({
          gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET,
          estimates: gasFeeEstimates.gasFeeEstimates,
        }),
      );

      expect(eip1559SelectedGasFee()).toEqual({
        suggestedMaxFeePerGas: '9',
        suggestedMaxPriorityFeePerGas: '8',
        suggestedGasLimit: '30000',
        selectedOption: null,
        estimatedBaseFee: '0.000000013',
      });
    });

    it('returns the parse error message when EIP-1559 parsing throws', () => {
      mockedParseTransactionEIP1559.mockImplementation(() => {
        throw new Error('parse failure');
      });

      const { result } = renderUseGasTransaction(
        { gasSelected: 'medium' },
        buildState({
          gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET,
          estimates: gasFeeEstimates.gasFeeEstimates,
        }),
      );

      expect(result.current).toEqual('Error parsing transaction data');
    });
  });
});
