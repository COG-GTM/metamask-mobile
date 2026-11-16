import { swapsUtils } from '@metamask/swaps-controller';
import BN from 'bnjs4';

/* eslint-disable-next-line import/no-namespace */
import * as controllerUtilsModule from '@metamask/controller-utils';

import { handleMethodData } from '../../util/transaction-controller';

import { BNToHex } from '../number';
import { UINT256_BN_MAX_VALUE } from '../../constants/transaction';
import { NEGATIVE_TOKEN_DECIMALS } from '../../constants/error';
import {
  generateTransferData,
  calcTokenAmount,
  decodeApproveData,
  decodeTransferData,
  getMethodData,
  getActionKey,
  generateTxWithNewTokenAllowance,
  minimumTokenAllowance,
  TOKEN_METHOD_TRANSFER,
  CONTRACT_METHOD_DEPLOY,
  TOKEN_METHOD_TRANSFER_FROM,
  calculateEIP1559Times,
  parseTransactionLegacy,
  parseTransactionEIP1559,
  calculateEIP1559GasFeeHexes,
  calculateAmountsEIP1559,
  calculateEthEIP1559,
  calculateERC20EIP1559,
  getIsNativeTokenTransferred,
  getIsSwapApproveOrSwapTransaction,
  getIsSwapApproveTransaction,
  getIsSwapTransaction,
  INCREASE_ALLOWANCE_SIGNATURE,
  TOKEN_METHOD_INCREASE_ALLOWANCE,
  getTransactionActionKey,
  generateApprovalData,
  getFourByteSignature,
  APPROVE_FUNCTION_SIGNATURE,
  isApprovalTransaction,
  SET_APPROVAL_FOR_ALL_SIGNATURE,
  TOKEN_METHOD_SET_APPROVAL_FOR_ALL,
  TOKEN_METHOD_APPROVE,
  getTransactionReviewActionKey,
  getTransactionById,
} from '.';
import Engine from '../../core/Engine';
import { strings } from '../../../locales/i18n';
import { TransactionType } from '@metamask/transaction-controller';
import { Provider } from '@metamask/network-controller';
import BigNumber from 'bignumber.js';

jest.mock('@metamask/controller-utils', () => ({
  ...jest.requireActual('@metamask/controller-utils'),
  query: jest.fn(),
}));
jest.mock('../../core/Engine');
// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ENGINE_MOCK = Engine as jest.MockedClass<any>;

jest.mock('../../util/transaction-controller');

const MOCK_ADDRESS1 = '0x0001';
const MOCK_ADDRESS2 = '0x0002';
const MOCK_ADDRESS3 = '0xb794f5ea0ba39494ce839613fffba74279579268';

const UNI_TICKER = 'UNI';
const UNI_ADDRESS = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984';

const MOCK_CHAIN_ID = '1';
const MOCK_NETWORK_CLIENT_ID = 'testNetworkClientId';

ENGINE_MOCK.context = {
  NetworkController: {
    findNetworkClientIdByChainId: () => MOCK_NETWORK_CLIENT_ID,
    getNetworkClientById: () => ({
      provider: {} as Provider,
    }),
  },
  TokenListController: {
    state: {
      tokensChainsCache: {
        '0x1': {
          data: [],
        },
      },
    },
  },
};

const spyOnQueryMethod = (returnValue: string | undefined) =>
  jest.spyOn(controllerUtilsModule, 'query').mockImplementation(
    () =>
      new Promise<string | undefined>((resolve) => {
        resolve(returnValue);
      }),
  );

describe('Transactions utils :: generateTransferData', () => {
  it('generateTransferData should throw if undefined values', () => {
    expect(() => generateTransferData()).toThrow();
    expect(() => generateTransferData('transfer')).toThrow();
    expect(() =>
      generateTransferData('transfer', { toAddress: '0x0' }),
    ).toThrow();
    expect(() => generateTransferData('transfer', { amount: 1 })).toThrow();
    expect(() =>
      generateTransferData('transfer', { toAddress: '0x0', amount: 1 }),
    ).not.toThrow();
  });

  it('generateTransferData generates data correctly', () => {
    expect(
      generateTransferData('transfer', {
        toAddress: '0x56ced0d816c668d7c0bcc3fbf0ab2c6896f589a0',
        amount: 1,
      }),
    ).toEqual(
      '0xa9059cbb00000000000000000000000056ced0d816c668d7c0bcc3fbf0ab2c6896f589a00000000000000000000000000000000000000000000000000000000000000001',
    );
  });
});

describe('Transactions utils :: calcTokenAmount', () => {
  it.each([
    // number values
    [0, 5, '0'],
    [123456, undefined, '123456'],
    [123456, 5, '1.23456'],
    [123456, 6, '0.123456'],
    // Do not delete the following test. Testing decimal = 36 is important because it has broken
    // BigNumber#div in the past when the value that was passed into it was not a BigNumber.
    [123456, 36, '1.23456e-31'],
    [3000123456789678, 6, '3000123456.789678'],
    // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
    [3000123456789123456789123456789, 3, '3.0001234567891233e+27'], // expected precision lost
    // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
    [3000123456789123456789123456789, 6, '3.0001234567891233e+24'], // expected precision lost
    // string values
    ['0', 5, '0'],
    ['123456', undefined, '123456'],
    ['123456', 5, '1.23456'],
    ['123456', 6, '0.123456'],
    ['3000123456789678', 6, '3000123456.789678'],
    [
      '3000123456789123456789123456789',
      3,
      '3.000123456789123456789123456789e+27',
    ],
    [
      '3000123456789123456789123456789',
      6,
      '3.000123456789123456789123456789e+24',
    ],
    // BigNumber values
    [new BigNumber('3000123456789678'), 6, '3000123456.789678'],
    [
      new BigNumber('3000123456789123456789123456789'),
      6,
      '3.000123456789123456789123456789e+24',
    ],
  ])(
    'returns the value %s divided by 10^%s = %s',
    (value, decimals, expected) => {
      expect(calcTokenAmount(value, decimals).toString()).toBe(expected);
    },
  );
});

describe('Transactions utils :: decodeTransferData', () => {
  it('decodeTransferData transfer', () => {
    const [address, amount] = decodeTransferData(
      'transfer',
      '0xa9059cbb00000000000000000000000056ced0d816c668d7c0bcc3fbf0ab2c6896f589a00000000000000000000000000000000000000000000000000000000000000001',
    );
    expect(address).toEqual('0x56ced0d816c668d7c0bcc3fbf0ab2c6896f589a0');
    expect(amount).toEqual('1');
  });

  it('decodeTransferData ERC721', () => {
    const [fromAddress, toAddress, tokenId] = decodeTransferData(
      'transferFrom',
      '0x23b872dd00000000000000000000000056ced0d816c668d7c0bcc3fbf0ab2c6896f589c900000000000000000000000056ced0d816c668d7c0bcc3fbf0ab2c6896f589b400000000000000000000000000000000000000000000000000000000000004f1',
    );
    expect(fromAddress).toEqual('0x56ced0d816c668d7c0bcc3fbf0ab2c6896f589c9');
    expect(toAddress).toEqual('0x56ced0d816c668d7c0bcc3fbf0ab2c6896f589b4');
    expect(tokenId).toEqual('1265');
  });
});

describe('Transactions utils :: parseTransactionLegacy', () => {
  const totalHexValueMocked = '02';
  const commonParseTransactionParams = {
    contractExchangeRates: {
      '0x0': 0.005,
      '0x01': 0.005,
      '0x02': 0.005,
    },
    conversionRate: 1,
    currentCurrency: 'USD',
    selectedGasFee: 'average',
    multiLayerL1FeeTotal: '0x0',
    ticker: 'tBNB',
  };

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createTransactionState = (selectedAsset: any, transaction: any) => ({
    selectedAsset,
    transaction: {
      value: '0x2',
      data: '0xa9059cbb00000000000000000000000056ced0d816c668d7c0bcc3fbf0ab2c6896f589a00000000000000000000000000000000000000000000000000000000000000002',
      ...transaction,
    },
  });

  const createExpectedResult = ({
    totalHexValue,
    transactionTotalAmount,
    transactionTotalAmountFiat,
    transactionFee,
    onlyGas = false,
  }: {
    totalHexValue: string;
    transactionTotalAmount?: string;
    transactionTotalAmountFiat?: string;
    transactionFee?: string;
    ticker?: string;
    onlyGas?: boolean;
  }) => {
    const expectedParsedTransactionLegacy = {
      suggestedGasLimit: undefined,
      suggestedGasPrice: undefined,
      suggestedGasLimitHex: '0x0',
      suggestedGasPriceHex: '0',
      totalHex: new BN(totalHexValue),
      transactionFee,
      transactionFeeFiat: '$0',
    };
    if (onlyGas) {
      return expectedParsedTransactionLegacy;
    }
    return {
      ...expectedParsedTransactionLegacy,
      transactionTotalAmount,
      transactionTotalAmountFiat,
    };
  };
  it('parse ETH legacy transaction', () => {
    const selectedAsset = {
      isETH: true,
      address: '0x0',
      symbol: 'ETH',
      decimals: 8,
    };

    const transactionState = createTransactionState(selectedAsset, {});

    const parsedTransactionLegacy = parseTransactionLegacy({
      ...commonParseTransactionParams,
      ticker: 'ETH',
      transactionState,
    });

    const expectedResult = createExpectedResult({
      totalHexValue: totalHexValueMocked,
      transactionTotalAmount: '< 0.00001 ETH',
      transactionTotalAmountFiat: '$0',
      transactionFee: '0 ETH',
    });

    expect(parsedTransactionLegacy).toEqual(expectedResult);
  });

  it('parse non ETH legacy transaction with tokenId', () => {
    const selectedAsset = {
      isETH: false,
      address: '0x0123',
      symbol: 'BNB',
      decimals: 18,
      tokenId: 'mockedTokenId',
    };

    const transactionState = createTransactionState(selectedAsset, {});

    const parsedTransactionLegacy = parseTransactionLegacy({
      ...commonParseTransactionParams,
      ticker: selectedAsset.symbol,
      transactionState,
    });

    const expectedResult = createExpectedResult({
      totalHexValue: totalHexValueMocked,
      transactionTotalAmount: '0 BNB',
      transactionTotalAmountFiat: '$0',
      transactionFee: '0 BNB',
    });

    expect(parsedTransactionLegacy).toEqual(expectedResult);
  });

  it('parse non ETH legacy transaction', () => {
    const transactionState = createTransactionState('tBNB', {});

    const parsedTransactionLegacy = parseTransactionLegacy({
      ...commonParseTransactionParams,
      transactionState,
    });

    const expectedResult = createExpectedResult({
      totalHexValue: totalHexValueMocked,
      transactionTotalAmount: '0.2 ERC20 + 0 tBNB',
      transactionTotalAmountFiat: '0 USD',
      transactionFee: '0 tBNB',
    });

    expect(parsedTransactionLegacy).toEqual(expectedResult);
  });

  it('parse non ETH legacy transaction without data property', () => {
    const transactionState = createTransactionState('tBNB', {
      data: undefined,
    });

    const parsedTransactionLegacy = parseTransactionLegacy({
      ...commonParseTransactionParams,
      transactionState,
    });

    const expectedResult = createExpectedResult({
      totalHexValue: totalHexValueMocked,
      transactionTotalAmount: undefined,
      transactionTotalAmountFiat: undefined,
      transactionFee: '0 tBNB',
    });

    expect(parsedTransactionLegacy).toEqual(expectedResult);
  });

  it('parse legacy transaction only gas', () => {
    const selectedAsset = 'BNB';
    const transactionState = createTransactionState(selectedAsset, {});

    const parsedTransactionLegacy = parseTransactionLegacy(
      {
        ...commonParseTransactionParams,
        ticker: selectedAsset,
        transactionState,
      },
      { onlyGas: true },
    );

    const expectedResult = createExpectedResult({
      totalHexValue: totalHexValueMocked,
      transactionTotalAmount: '0 BNB',
      transactionTotalAmountFiat: '$0',
      transactionFee: '0 BNB',
      onlyGas: true,
    });

    expect(parsedTransactionLegacy).toEqual(expectedResult);
  });
});

// The EIP-1559 helpers live in untyped JS, so TS infers overly narrow
// signatures from their default parameters.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedFn = (...args: any[]) => any;
const parseEIP1559 = parseTransactionEIP1559 as UntypedFn;
const calcGasFeeHexes = calculateEIP1559GasFeeHexes as UntypedFn;
const calcAmounts = calculateAmountsEIP1559 as UntypedFn;
const calcEth = calculateEthEIP1559 as UntypedFn;
const calcERC20 = calculateERC20EIP1559 as UntypedFn;

const hexToDec = (hex: string) =>
  new BN(hex.replace(/^0x/, ''), 16).toString(10);

describe('Transactions utils :: parseTransactionEIP1559', () => {
  // 10 gwei base fee, 2 gwei priority fee, 30 gwei max fee, 21000 gas limit.
  // base + priority = 12 gwei; min fee = 12 gwei * 21000 = 252000 gwei.
  // max fee = 30 gwei * 21000 = 630000 gwei; priority * limit = 42000 gwei.
  const ONE_ETH_HEX = '0xde0b6b3a7640000';
  const ONE_ETH_WEI = '1000000000000000000';
  const TOKEN_ADDRESS = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984';
  // transfer(0x56ced0d8..., 10 * 10^18)
  const ERC20_TRANSFER_DATA =
    '0xa9059cbb00000000000000000000000056ced0d816c668d7c0bcc3fbf0ab2c6896f589a00000000000000000000000000000000000000000000000008ac7230489e80000';

  const createSelectedGasFee = (overrides = {}) => ({
    suggestedMaxPriorityFeePerGas: '2',
    suggestedMaxFeePerGas: '30',
    estimatedBaseFee: '10',
    suggestedGasLimit: '21000',
    ...overrides,
  });

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createTransactionState = (selectedAsset: any, transaction: any) => ({
    selectedAsset,
    transaction: {
      value: ONE_ETH_HEX,
      data: undefined,
      ...transaction,
    },
  });

  const commonParams = {
    contractExchangeRates: {},
    conversionRate: 2000,
    currentCurrency: 'usd',
    nativeCurrency: 'ETH',
    gasFeeEstimates: {},
  };

  const ETH_ASSET = { isETH: true, symbol: 'ETH', decimals: 18 };

  it('computes fee hexes, totals and renderable strings for an ETH transfer', () => {
    const result = parseEIP1559({
      ...commonParams,
      selectedGasFee: createSelectedGasFee(),
      transactionState: createTransactionState(ETH_ASSET, {}),
    });

    expect(hexToDec(result.estimatedBaseFeeHex)).toBe('10000000000');
    expect(hexToDec(result.suggestedMaxPriorityFeePerGasHex)).toBe(
      '2000000000',
    );
    expect(hexToDec(result.suggestedMaxFeePerGasHex)).toBe('30000000000');
    expect(hexToDec(result.gasLimitHex)).toBe('21000');

    // The full shape exposes the min fee only through totalMinHex
    expect(result).not.toHaveProperty('gasFeeMinHex');
    expect(hexToDec(result.gasFeeMaxHex)).toBe('630000000000000');
    expect(hexToDec(result.totalMinHex)).toBe('1000252000000000000');
    expect(hexToDec(result.totalMaxHex)).toBe('1000630000000000000');

    expect(result).toEqual(
      expect.objectContaining({
        gasFeeMinNative: '0.000252',
        gasFeeMinConversion: '0.5',
        gasFeeMaxNative: '0.00063',
        gasFeeMaxConversion: '1.26',
        maxPriorityFeeNative: '0.000042',
        maxPriorityFeeConversion: '0.08',
        renderableGasFeeMinNative: '0.000252 ETH',
        renderableGasFeeMinConversion: '$0.50',
        renderableGasFeeMaxNative: '0.00063 ETH',
        renderableGasFeeMaxConversion: '$1.26',
        renderableMaxPriorityFeeNative: '0.000042 ETH',
        renderableMaxPriorityFeeConversion: '$0.08',
        renderableMaxFeePerGasNative: '0.00063 ETH',
        renderableMaxFeePerGasConversion: '$1.26',
        totalMinNative: '1.000252',
        totalMinConversion: '2000.5',
        totalMaxNative: '1.00063',
        totalMaxConversion: '2001.26',
        renderableTotalMinNative: '1.000252 ETH',
        renderableTotalMinConversion: '$2,000.50',
        renderableTotalMaxNative: '1.00063 ETH',
        renderableTotalMaxConversion: '$2,001.26',
        estimatedBaseFee: '10',
        suggestedMaxPriorityFeePerGas: '2',
        suggestedMaxFeePerGas: '30',
        suggestedGasLimit: '21000',
      }),
    );
  });

  it('uses the estimated gas limit for the min fee only when it is present', () => {
    const withEstimate = parseEIP1559({
      ...commonParams,
      selectedGasFee: createSelectedGasFee({
        suggestedEstimatedGasLimit: '20000',
      }),
      transactionState: createTransactionState(ETH_ASSET, {}),
    });
    // value + 12 gwei * 20000
    expect(hexToDec(withEstimate.totalMinHex)).toBe('1000240000000000000');
    expect(withEstimate.gasFeeMinNative).toBe('0.00024');
    // max fee still uses the suggested gas limit: 30 gwei * 21000
    expect(hexToDec(withEstimate.gasFeeMaxHex)).toBe('630000000000000');
    expect(hexToDec(withEstimate.gasLimitHex)).toBe('21000');

    const withoutEstimate = parseEIP1559({
      ...commonParams,
      selectedGasFee: createSelectedGasFee(),
      transactionState: createTransactionState(ETH_ASSET, {}),
    });
    // value + 12 gwei * 21000
    expect(hexToDec(withoutEstimate.totalMinHex)).toBe('1000252000000000000');
    expect(withoutEstimate.gasFeeMinNative).toBe('0.000252');
  });

  it('treats a missing estimated base fee as zero', () => {
    const result = parseEIP1559({
      ...commonParams,
      selectedGasFee: createSelectedGasFee({ estimatedBaseFee: undefined }),
      transactionState: createTransactionState(ETH_ASSET, {}),
    });
    expect(result.estimatedBaseFee).toBe('0');
    // value + 2 gwei * 21000
    expect(hexToDec(result.totalMinHex)).toBe('1000042000000000000');
  });

  it('returns only gas fields with totalMaxHex = gasFeeMax + value when onlyGas is true', () => {
    const result = parseEIP1559(
      {
        ...commonParams,
        selectedGasFee: createSelectedGasFee(),
        transactionState: createTransactionState(ETH_ASSET, {}),
      },
      { onlyGas: true },
    );

    expect(hexToDec(result.gasFeeMaxHex)).toBe('630000000000000');
    expect(hexToDec(result.totalMaxHex)).toBe('1000630000000000000');
    expect(result.renderableGasFeeMaxNative).toBe('0.00063 ETH');
    expect(result.suggestedEstimatedGasLimit).toBeUndefined();
    expect(result).not.toHaveProperty('totalMinHex');
    expect(result).not.toHaveProperty('totalMinNative');
    expect(result).not.toHaveProperty('renderableTotalMaxNative');
    expect(result).not.toHaveProperty('gasFeeMinHex');
  });

  it('defaults value to 0x0 when the transaction has no value', () => {
    const result = parseEIP1559(
      {
        ...commonParams,
        selectedGasFee: createSelectedGasFee(),
        transactionState: createTransactionState(ETH_ASSET, {
          value: undefined,
        }),
      },
      { onlyGas: true },
    );
    expect(hexToDec(result.totalMaxHex)).toBe('630000000000000');
  });

  it('adds tradeValue and subtracts the decimal sourceAmount for native-asset swaps', () => {
    const result = parseEIP1559({
      ...commonParams,
      selectedGasFee: createSelectedGasFee(),
      swapsParams: {
        tradeValue: ONE_ETH_HEX,
        isNativeAsset: true,
        sourceAmount: ONE_ETH_WEI,
      },
      transactionState: createTransactionState(ETH_ASSET, { value: '0x0' }),
    });

    // tradeValue (1 ETH, hex) - sourceAmount (1 ETH, decimal) cancel out
    expect(hexToDec(result.totalMinHex)).toBe('252000000000000');
    expect(hexToDec(result.gasFeeMaxHex)).toBe('630000000000000');
    expect(hexToDec(result.totalMaxHex)).toBe('630000000000000');
  });

  it('subtracts a native sourceAmount smaller than tradeValue in base 10', () => {
    const result = parseEIP1559({
      ...commonParams,
      selectedGasFee: createSelectedGasFee(),
      swapsParams: {
        // 1.01 ETH sent, of which 1 ETH is the swapped amount (0.01 ETH fee)
        tradeValue: '0xe043da617250000',
        isNativeAsset: true,
        sourceAmount: ONE_ETH_WEI,
      },
      transactionState: createTransactionState(ETH_ASSET, { value: '0x0' }),
    });

    expect(hexToDec(result.gasFeeMaxHex)).toBe('10630000000000000');
    expect(hexToDec(result.totalMinHex)).toBe('10252000000000000');
  });

  it('adds tradeValue without subtracting sourceAmount for non-native swaps', () => {
    const result = parseEIP1559({
      ...commonParams,
      selectedGasFee: createSelectedGasFee(),
      swapsParams: {
        tradeValue: ONE_ETH_HEX,
        isNativeAsset: false,
        sourceAmount: '5000000',
      },
      transactionState: createTransactionState(ETH_ASSET, { value: '0x0' }),
    });

    expect(hexToDec(result.totalMinHex)).toBe('1000252000000000000');
    expect(hexToDec(result.gasFeeMaxHex)).toBe('1000630000000000000');
  });

  it('includes the ERC20 token amount in the totals using the contract exchange rate', () => {
    const result = parseEIP1559({
      ...commonParams,
      contractExchangeRates: { [TOKEN_ADDRESS]: { price: 0.5 } },
      selectedGasFee: createSelectedGasFee(),
      transactionState: createTransactionState(
        { address: TOKEN_ADDRESS, symbol: 'UNI', decimals: 18 },
        { value: '0x0', data: ERC20_TRANSFER_DATA },
      ),
    });

    expect(hexToDec(result.totalMaxHex)).toBe('630000000000000');
    expect(result.totalMaxNative).toBe('0.00063');
    // 10 UNI * 0.5 ETH/UNI * 2000 USD/ETH = 10000 USD, plus gas
    expect(result.renderableTotalMinNative).toBe('10 UNI + 0.000252 ETH');
    expect(result.renderableTotalMaxNative).toBe('10 UNI + 0.00063 ETH');
    expect(result.renderableTotalMinConversion).toBe('$10,000.50');
    expect(result.renderableTotalMaxConversion).toBe('$10,001.26');
  });

  it('excludes the token amount from the fiat total when the exchange rate is missing', () => {
    const result = parseEIP1559({
      ...commonParams,
      contractExchangeRates: {},
      selectedGasFee: createSelectedGasFee(),
      transactionState: createTransactionState(
        { address: TOKEN_ADDRESS, decimals: 18 },
        { value: '0x0', data: ERC20_TRANSFER_DATA },
      ),
    });

    expect(result.renderableTotalMaxNative).toBe('10 ERC20 + 0.00063 ETH');
    expect(result.renderableTotalMinConversion).toBe('$0.50');
    expect(result.renderableTotalMaxConversion).toBe('$1.26');
  });

  it('renders the NFT (tokenId) total like a native transfer', () => {
    const result = parseEIP1559({
      ...commonParams,
      selectedGasFee: createSelectedGasFee(),
      transactionState: createTransactionState(
        { address: TOKEN_ADDRESS, symbol: 'NFT', tokenId: '1' },
        { value: '0x0', data: ERC20_TRANSFER_DATA },
      ),
    });

    expect(result.renderableTotalMaxNative).toBe('0.00063 ETH');
    expect(result.renderableTotalMaxConversion).toBe('$1.26');
  });

  it('handles zero fees', () => {
    const result = parseEIP1559({
      ...commonParams,
      selectedGasFee: createSelectedGasFee({
        suggestedMaxPriorityFeePerGas: '0',
        suggestedMaxFeePerGas: '0',
        estimatedBaseFee: '0',
      }),
      transactionState: createTransactionState(ETH_ASSET, { value: '0x0' }),
    });

    expect(hexToDec(result.totalMinHex)).toBe('0');
    expect(hexToDec(result.gasFeeMaxHex)).toBe('0');
    expect(hexToDec(result.totalMaxHex)).toBe('0');
    expect(result.renderableGasFeeMaxNative).toBe('0 ETH');
    expect(result.renderableGasFeeMaxConversion).toBe('$0.00');
    expect(result.renderableGasFeeMinNative).toBe('0 ETH');
    expect(result.renderableMaxPriorityFeeNative).toBe('0 ETH');
    expect(result.renderableMaxFeePerGasNative).toBe('0 ETH');
    expect(result.renderableTotalMaxNative).toBe('0 ETH');
  });

  it('renders a non-zero fee that rounds to 0 as "< 0.000001"', () => {
    const result = parseEIP1559({
      ...commonParams,
      selectedGasFee: createSelectedGasFee({
        // 10000 wei per gas * 21000 = 2.1e-10 ETH
        suggestedMaxPriorityFeePerGas: '0.00001',
        suggestedMaxFeePerGas: '0.00001',
        estimatedBaseFee: '0',
      }),
      transactionState: createTransactionState(ETH_ASSET, { value: '0x0' }),
    });

    expect(hexToDec(result.gasFeeMaxHex)).toBe('210000000');
    expect(result.gasFeeMaxNative).toBe('0');
    expect(result.renderableGasFeeMaxNative).toBe('< 0.000001 ETH');
    expect(result.renderableGasFeeMinNative).toBe('< 0.000001 ETH');
  });
});

describe('Transactions utils :: calculateEIP1559GasFeeHexes', () => {
  const params = {
    gasLimitHex: '0x5208', // 21000
    estimatedBaseFeeHex: '0x2540be400', // 10 gwei
    suggestedMaxPriorityFeePerGasHex: '0x77359400', // 2 gwei
    suggestedMaxFeePerGasHex: '0x6fc23ac00', // 30 gwei
  };

  it('computes min/max fee hexes from the gas limit when no estimate is given', () => {
    const result = calcGasFeeHexes(params);

    expect(
      hexToDec(result.estimatedBaseFee_PLUS_suggestedMaxPriorityFeePerGasHex),
    ).toBe('12000000000');
    expect(hexToDec(result.maxPriorityFeePerGasTimesGasLimitHex)).toBe(
      '42000000000000',
    );
    expect(hexToDec(result.gasFeeMinHex)).toBe('252000000000000');
    expect(hexToDec(result.gasFeeMaxHex)).toBe('630000000000000');
  });

  it('uses the estimated gas limit for the min fee only', () => {
    const result = calcGasFeeHexes({
      ...params,
      estimatedGasLimitHex: '0x4e20', // 20000
    });

    expect(hexToDec(result.gasFeeMinHex)).toBe('240000000000000');
    expect(hexToDec(result.gasFeeMaxHex)).toBe('630000000000000');
    expect(hexToDec(result.maxPriorityFeePerGasTimesGasLimitHex)).toBe(
      '42000000000000',
    );
  });

  it('returns zero for zero fees', () => {
    const result = calcGasFeeHexes({
      gasLimitHex: '0x5208',
      estimatedBaseFeeHex: '0x0',
      suggestedMaxPriorityFeePerGasHex: '0x0',
      suggestedMaxFeePerGasHex: '0x0',
    });

    expect(hexToDec(result.gasFeeMinHex)).toBe('0');
    expect(hexToDec(result.gasFeeMaxHex)).toBe('0');
  });
});

describe('Transactions utils :: calculateAmountsEIP1559', () => {
  it('adds the value to the gas fees in native, fiat and hex', () => {
    const result = calcAmounts({
      value: '0xde0b6b3a7640000', // 1 ETH
      nativeCurrency: 'ETH',
      currentCurrency: 'usd',
      conversionRate: 2000,
      gasFeeMinNative: '0.000252',
      gasFeeMinConversion: '0.5',
      gasFeeMaxNative: '0.00063',
      gasFeeMaxConversion: '1.26',
      gasFeeMinHex: 'e531527bc000', // 252000 gwei
      gasFeeMaxHex: '23cfb4e356000', // 630000 gwei
    });

    expect(result.totalMinNative).toBe('1.000252');
    expect(result.totalMaxNative).toBe('1.00063');
    expect(result.totalMinConversion).toBe('2000.5');
    expect(result.totalMaxConversion).toBe('2001.26');
    expect(hexToDec(result.totalMinHex)).toBe('1000252000000000000');
    expect(hexToDec(result.totalMaxHex)).toBe('1000630000000000000');
  });

  it('returns only the gas fees when the value is zero', () => {
    const result = calcAmounts({
      value: '0x0',
      nativeCurrency: 'ETH',
      currentCurrency: 'usd',
      conversionRate: 2000,
      gasFeeMinNative: '0.000252',
      gasFeeMinConversion: '0.5',
      gasFeeMaxNative: '0.00063',
      gasFeeMaxConversion: '1.26',
      gasFeeMinHex: 'e531527bc000',
      gasFeeMaxHex: '23cfb4e356000',
    });

    expect(result.totalMaxNative).toBe('0.00063');
    expect(result.totalMaxConversion).toBe('1.26');
    expect(hexToDec(result.totalMaxHex)).toBe('630000000000000');
  });
});

describe('Transactions utils :: calculateEthEIP1559', () => {
  it('formats native and fiat totals', () => {
    expect(
      calcEth({
        nativeCurrency: 'ETH',
        currentCurrency: 'usd',
        totalMinNative: '1.000252',
        totalMinConversion: '2000.5',
        totalMaxNative: '1.00063',
        totalMaxConversion: '2001.26',
      }),
    ).toEqual(['1.000252 ETH', '$2,000.50', '1.00063 ETH', '$2,001.26']);
  });
});

describe('Transactions utils :: calculateERC20EIP1559', () => {
  const params = {
    currentCurrency: 'usd',
    nativeCurrency: 'ETH',
    conversionRate: 2000,
    tokenAmount: '10',
    totalMinConversion: '0.5',
    totalMaxConversion: '1.26',
    symbol: 'UNI',
    totalMinNative: '0.000252',
    totalMaxNative: '0.00063',
  };

  it('adds the token fiat value to the gas fiat totals', () => {
    expect(calcERC20({ ...params, exchangeRate: 0.5 })).toEqual([
      '10 UNI + 0.000252 ETH',
      '$10,000.50',
      '10 UNI + 0.00063 ETH',
      '$10,001.26',
    ]);
  });

  it('only counts gas in the fiat totals when the exchange rate is missing', () => {
    expect(calcERC20({ ...params, exchangeRate: undefined })).toEqual([
      '10 UNI + 0.000252 ETH',
      '$0.50',
      '10 UNI + 0.00063 ETH',
      '$1.26',
    ]);
  });
});

describe('Transactions utils :: getMethodData', () => {
  it('getMethodData', async () => {
    const invalidData = '0x';
    const transferData =
      '0xa9059cbb00000000000000000000000056ced0d816c668d7c0bcc3fbf0ab2c6896f589a00000000000000000000000000000000000000000000000000000000000000001';
    const deployData =
      '0x60a060405260046060527f48302e31000000000000000000000000000000000000000000000000000000006080526006805460008290527f48302e310000000000000000000000000000000000000000000000000000000882556100b5907ff652222313e28459528d920b65115c16c04f3efc82aaedc97be59f3f377c0d3f602060026001841615610100026000190190931692909204601f01919091048101905b8082111561017957600081556001016100a1565b505060405161094b38038061094b833981';
    const randomData = '0x987654321000000000';
    const transferFromData = '0x23b872dd0000000000000000000000000000';
    const increaseAllowanceDataMock = `${INCREASE_ALLOWANCE_SIGNATURE}0000000000000000000000000000`;
    const setApprovalForAllDataMock = `${SET_APPROVAL_FOR_ALL_SIGNATURE}0000000000000000000000000000`;
    const approveDataMock = `${APPROVE_FUNCTION_SIGNATURE}000000000000000000000000`;
    const invalidMethodData = await getMethodData(
      invalidData,
      MOCK_NETWORK_CLIENT_ID,
    );
    const transferMethodData = await getMethodData(
      transferData,
      MOCK_NETWORK_CLIENT_ID,
    );
    const deployMethodData = await getMethodData(
      deployData,
      MOCK_NETWORK_CLIENT_ID,
    );
    const transferFromMethodData = await getMethodData(
      transferFromData,
      MOCK_NETWORK_CLIENT_ID,
    );
    const randomMethodData = await getMethodData(
      randomData,
      MOCK_NETWORK_CLIENT_ID,
    );
    const approvalMethodData = await getMethodData(
      approveDataMock,
      MOCK_NETWORK_CLIENT_ID,
    );
    const increaseAllowanceMethodData = await getMethodData(
      increaseAllowanceDataMock,
      MOCK_NETWORK_CLIENT_ID,
    );
    const setApprovalForAllMethodData = await getMethodData(
      setApprovalForAllDataMock,
      MOCK_NETWORK_CLIENT_ID,
    );
    expect(invalidMethodData).toEqual({});
    expect(transferMethodData.name).toEqual(TOKEN_METHOD_TRANSFER);
    expect(deployMethodData.name).toEqual(CONTRACT_METHOD_DEPLOY);
    expect(transferFromMethodData.name).toEqual(TOKEN_METHOD_TRANSFER_FROM);
    expect(randomMethodData).toEqual({});
    expect(approvalMethodData.name).toEqual(TOKEN_METHOD_APPROVE);
    expect(increaseAllowanceMethodData.name).toEqual(
      TOKEN_METHOD_INCREASE_ALLOWANCE,
    );
    expect(setApprovalForAllMethodData.name).toEqual(
      TOKEN_METHOD_SET_APPROVAL_FOR_ALL,
    );
  });

  it('calls handleMethodData with the correct data', async () => {
    (handleMethodData as jest.Mock).mockResolvedValue({
      parsedRegistryMethod: { name: TOKEN_METHOD_TRANSFER },
    });
    const transferData =
      '0xa9059cbb00000000000000000000000056ced0d816c668d7c0bcc3fbf0ab2c6896f589a';
    await getMethodData(transferData, MOCK_NETWORK_CLIENT_ID);
    expect(handleMethodData).toHaveBeenCalledWith(
      '0x98765432',
      MOCK_NETWORK_CLIENT_ID,
    );
  });
});

describe('Transactions utils :: getActionKey', () => {
  beforeEach(() => {
    jest
      .spyOn(swapsUtils, 'getSwapsContractAddress')
      .mockImplementation(() => 'SWAPS_CONTRACT_ADDRESS');
  });

  it('should be "Sent Yourself Ether"', async () => {
    spyOnQueryMethod(undefined);
    const tx = {
      txParams: {
        from: MOCK_ADDRESS1,
        to: MOCK_ADDRESS1,
      },
    };
    const result = await getActionKey(
      tx,
      MOCK_ADDRESS1,
      undefined,
      MOCK_CHAIN_ID,
    );
    expect(result).toBe(strings('transactions.self_sent_ether'));
  });

  it('should be labeled as "Sent Yourself UNI"', async () => {
    spyOnQueryMethod(undefined);
    const tx = {
      txParams: {
        from: MOCK_ADDRESS1,
        to: MOCK_ADDRESS1,
      },
    };
    const result = await getActionKey(
      tx,
      MOCK_ADDRESS1,
      UNI_TICKER,
      MOCK_CHAIN_ID,
    );
    expect(result).toBe(
      strings('transactions.self_sent_unit', { unit: UNI_TICKER }),
    );
  });

  it('should be labeled as "Sent Ether"', async () => {
    spyOnQueryMethod(undefined);
    const tx = {
      txParams: {
        from: MOCK_ADDRESS1,
        to: MOCK_ADDRESS2,
      },
    };
    const result = await getActionKey(
      tx,
      MOCK_ADDRESS1,
      undefined,
      MOCK_CHAIN_ID,
    );
    expect(result).toBe(strings('transactions.sent_ether'));
  });

  it('should be labeled as "Sent UNI"', async () => {
    spyOnQueryMethod(undefined);

    const tx = {
      txParams: {
        from: MOCK_ADDRESS1,
        to: MOCK_ADDRESS2,
      },
    };
    const result = await getActionKey(
      tx,
      MOCK_ADDRESS1,
      UNI_TICKER,
      MOCK_CHAIN_ID,
    );
    expect(result).toBe(
      strings('transactions.sent_unit', { unit: UNI_TICKER }),
    );
  });

  it('should be labeled as "Received Ether"', async () => {
    spyOnQueryMethod(undefined);

    const tx = {
      txParams: {
        from: MOCK_ADDRESS1,
        to: MOCK_ADDRESS2,
      },
    };
    const result = await getActionKey(
      tx,
      MOCK_ADDRESS2,
      undefined,
      MOCK_CHAIN_ID,
    );
    expect(result).toBe(strings('transactions.received_ether'));
  });

  it('should be labeled as "Received UNI"', async () => {
    spyOnQueryMethod(undefined);
    const tx = {
      txParams: {
        from: MOCK_ADDRESS1,
        to: MOCK_ADDRESS2,
      },
    };
    const result = await getActionKey(
      tx,
      MOCK_ADDRESS2,
      UNI_TICKER,
      MOCK_CHAIN_ID,
    );
    expect(result).toBe(
      strings('transactions.received_unit', { unit: UNI_TICKER }),
    );
  });

  it('should be labeled as "Smart Contract Interaction" if the receiver is a smart contract', async () => {
    spyOnQueryMethod(UNI_ADDRESS);
    const tx = {
      txParams: {
        to: UNI_ADDRESS,
      },
    };
    const result = await getActionKey(
      tx,
      MOCK_ADDRESS1,
      undefined,
      MOCK_CHAIN_ID,
    );
    expect(result).toBe(strings('transactions.smart_contract_interaction'));
  });

  it('should be labeled as "Smart Contract Interaction" if the tx is to a smart contract', async () => {
    spyOnQueryMethod(UNI_ADDRESS);
    const tx = {
      txParams: {
        to: UNI_ADDRESS,
      },
      toSmartContract: true,
    };
    const result = await getActionKey(
      tx,
      MOCK_ADDRESS1,
      undefined,
      MOCK_CHAIN_ID,
    );
    expect(result).toBe(strings('transactions.smart_contract_interaction'));
  });

  it('should be labeled as "Contract Deployment" if the tx has no receiver', async () => {
    spyOnQueryMethod(UNI_ADDRESS);
    const tx = {
      txParams: {},
      toSmartContract: true,
    };
    const result = await getActionKey(
      tx,
      MOCK_ADDRESS1,
      undefined,
      MOCK_CHAIN_ID,
    );
    expect(result).toBe(strings('transactions.contract_deploy'));
  });
});

describe('Transactions utils :: generateTxWithNewTokenAllowance', () => {
  const mockDecimal = 18;
  const mockTx = {
    txParams: {
      from: MOCK_ADDRESS1,
      to: MOCK_ADDRESS3,
    },
  };

  const decodeAmount = (data: string): string => {
    const decode = decodeApproveData(data);
    return BNToHex(decode.encodedAmount);
  };

  it('should encode a integer correctly and return a new transaction', () => {
    const newTx = generateTxWithNewTokenAllowance(
      '500',
      mockDecimal,
      MOCK_ADDRESS3,
      mockTx,
    );
    expect(newTx.data).toBeTruthy();

    const expectedHexValue =
      '0x00000000000000000000000000000000000000000000001b1ae4d6e2ef500000';
    const decodedHexValue = decodeAmount(newTx.data);
    expect(expectedHexValue).toBe(decodedHexValue);
  });

  it('should encode a decimal correctly and return a new transaction', () => {
    const newTx = generateTxWithNewTokenAllowance(
      '100.15',
      mockDecimal,
      MOCK_ADDRESS3,
      mockTx,
    );
    expect(newTx.data).toBeTruthy();

    const expectedHexValue =
      '0x0000000000000000000000000000000000000000000000056ddc4661ef5f0000';
    const decodedHexValue = decodeAmount(newTx.data);
    expect(expectedHexValue).toBe(decodedHexValue);
  });

  it('should encode the maximum amount uint256 can store correctly and return a new transaction', () => {
    const newTx = generateTxWithNewTokenAllowance(
      UINT256_BN_MAX_VALUE,
      0,
      MOCK_ADDRESS3,
      mockTx,
    );
    expect(newTx.data).toBeTruthy();

    const expectedHexValue =
      '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const decodedHexValue = decodeAmount(newTx.data);
    expect(expectedHexValue).toBe(decodedHexValue);
  });
  it('should encode the minimum amount uint256 can store correctly and return a new transaction', () => {
    const minAmount = '0.000000000000000001';
    const newTx = generateTxWithNewTokenAllowance(
      minAmount,
      mockDecimal,
      MOCK_ADDRESS3,
      mockTx,
    );
    expect(newTx.data).toBeTruthy();

    const expectedHexValue =
      '0x0000000000000000000000000000000000000000000000000000000000000001';
    const decodedHexValue = decodeAmount(newTx.data);
    expect(expectedHexValue).toBe(decodedHexValue);
  });
});

describe('Transaction utils :: generateApprovalData', () => {
  it('generates the correct data for a token increase allowance transaction', () => {
    const increaseAllowanceDataMock = `${INCREASE_ALLOWANCE_SIGNATURE}0000000000000000000000000000`;
    const data = generateApprovalData({
      spender: MOCK_ADDRESS3,
      value: '0x1',
      data: increaseAllowanceDataMock,
    });
    expect(data).toBe(
      '0x39509351000000000000000000000000b794f5ea0ba39494ce839613fffba742795792680000000000000000000000000000000000000000000000000000000000000001',
    );
  });
  it('generates the correct data for a approve transaction with a value of 0', () => {
    const data = generateApprovalData({
      spender: MOCK_ADDRESS3,
      value: '0x0',
      data: '0x095ea7b3',
    });
    expect(data).toBe(
      '0x095ea7b3000000000000000000000000b794f5ea0ba39494ce839613fffba742795792680000000000000000000000000000000000000000000000000000000000000000',
    );
  });

  it('throws an error if the spender is not defined', () => {
    expect(() => {
      generateApprovalData({
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spender: undefined as any,
        value: '0x0',
        data: '0x095ea7b3',
      });
    }).toThrow();
  });
});

describe('Transactions utils :: minimumTokenAllowance', () => {
  it('should show up to 18 decimals', () => {
    const result = minimumTokenAllowance(18);
    const expectedResult = '0.000000000000000001';
    expect(result).toBe(expectedResult);
  });
  it('should show up to 5 decimals', () => {
    const result = minimumTokenAllowance(5);
    const expectedResult = '0.00001';
    expect(result).toBe(expectedResult);
  });
  it('should show up to 1 decimals', () => {
    const result = minimumTokenAllowance(1);
    const expectedResult = '0.1';
    expect(result).toBe(expectedResult);
  });
  it('should show 1', () => {
    const result = minimumTokenAllowance(0);
    const expectedResult = '1';
    expect(result).toBe(expectedResult);
  });
  it('should throw an error for negative values', () => {
    expect(() => {
      minimumTokenAllowance(-1);
    }).toThrow(NEGATIVE_TOKEN_DECIMALS);
  });
});

describe('Transaction utils :: calculateEIP1559Times', () => {
  const gasFeeEstimates = {
    baseFeeTrend: 'down',
    estimatedBaseFee: '2.420440144',
    high: {
      maxWaitTimeEstimate: 60000,
      minWaitTimeEstimate: 15000,
      suggestedMaxFeePerGas: '6.114748245',
      suggestedMaxPriorityFeePerGas: '2',
    },
    historicalBaseFeeRange: ['2.420440144', '9.121942855'],
    historicalPriorityFeeRange: ['0.006333568', '2997.107725'],
    latestPriorityFeeRange: ['0.039979856', '5'],
    low: {
      maxWaitTimeEstimate: 30000,
      minWaitTimeEstimate: 15000,
      suggestedMaxFeePerGas: '3.420440144',
      suggestedMaxPriorityFeePerGas: '1',
    },
    medium: {
      maxWaitTimeEstimate: 45000,
      minWaitTimeEstimate: 15000,
      suggestedMaxFeePerGas: '4.767594195',
      suggestedMaxPriorityFeePerGas: '1.5',
    },
    networkCongestion: 0,
    priorityFeeTrend: 'level',
  };

  it('returns data for very large gas fees estimates', () => {
    const EIP1559Times = calculateEIP1559Times({
      suggestedMaxFeePerGas: 1000000,
      suggestedMaxPriorityFeePerGas: 1000000,
      gasFeeEstimates,
      selectedOption: 'medium',
      recommended: undefined,
    });
    expect(EIP1559Times).toStrictEqual({
      timeEstimate: 'Likely in  15 seconds',
      timeEstimateColor: 'orange',
      timeEstimateId: 'very_likely',
    });
  });

  it('returns data for aggresive gas fees estimates', () => {
    const EIP1559Times = calculateEIP1559Times({
      suggestedMaxFeePerGas: 5.320770797,
      suggestedMaxPriorityFeePerGas: 2,
      gasFeeEstimates,
      selectedOption: 'high',
      recommended: undefined,
    });
    expect(EIP1559Times).toStrictEqual({
      timeEstimate: 'Likely in  15 seconds',
      timeEstimateColor: 'orange',
      timeEstimateId: 'very_likely',
    });
  });

  it('returns data for market gas fees estimates', () => {
    const EIP1559Times = calculateEIP1559Times({
      suggestedMaxFeePerGas: 4.310899437,
      suggestedMaxPriorityFeePerGas: 1.5,
      gasFeeEstimates,
      selectedOption: 'medium',
      recommended: undefined,
    });
    expect(EIP1559Times).toStrictEqual({
      timeEstimate: 'Likely in < 30 seconds',
      timeEstimateColor: 'green',
      timeEstimateId: 'likely',
    });
  });

  it('returns data for low gas fees estimates', () => {
    const EIP1559Times = calculateEIP1559Times({
      suggestedMaxFeePerGas: 2.667821471,
      suggestedMaxPriorityFeePerGas: 1,
      gasFeeEstimates,
      selectedOption: 'low',
      recommended: undefined,
    });
    expect(EIP1559Times).toStrictEqual({
      timeEstimate: 'Maybe in 30 seconds',
      timeEstimateColor: 'red',
      timeEstimateId: 'maybe',
    });
  });
});

const dappTxMeta = {
  chainId: '0x1',
  origin: 'pancakeswap.finance',
  transaction: {
    from: '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452',
    data: '0x5ae401dc0000000000000000000000000000000000000000000000000000000065e8dac400000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000e404e45aaf000000000000000000000000b4fbf271143f4fbf7b91a5ded31805e42b2208d600000000000000000000000007865c6e87b9f70255377e024ace6630c1eaa37f00000000000000000000000000000000000000000000000000000000000001f4000000000000000000000000c5fe6ef47965741f6f7a4734bf784bf3ae3f245200000000000000000000000000000000000000000000000000038d7ea4c680000000000000000000000000000000000000000000000000000000000f666eed80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    gas: '0x2e7b1',
    nonce: '0xeb',
    to: '0x9a489505a00ce272eaa5e07dba6491314cae3796',
    value: '0x38d7ea4c68000',
    maxFeePerGas: '0x59682f0a',
    maxPriorityFeePerGas: '0x59682f00',
  },
};
const sendEthTxMeta = {
  chainId: '0x1',
  origin: 'MetaMask Mobile',
  transaction: {
    from: '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452',
    data: undefined,
    gas: '0x5208',
    nonce: '0xf3',
    to: '0xdc738206f559bdae106894a62876a119e470aee2',
    value: '0x2386f26fc10000',
    maxFeePerGas: '0x59682f0a',
    maxPriorityFeePerGas: '0x59682f00',
    estimatedBaseFee: '0x7',
  },
};
const sendERC20TxMeta = {
  chainId: '0x1',
  origin: 'MetaMask Mobile',
  transaction: {
    from: '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452',
    data: '0xa9059cbb000000000000000000000000dc738206f559bdae106894a62876a119e470aee20000000000000000000000000000000000000000000000000000000005f5e100',
    gas: '0x10a3e',
    nonce: '0xf4',
    to: '0x07865c6e87b9f70255377e024ace6630c1eaa37f',
    value: '0x0',
    maxFeePerGas: '0x59682f0b',
    maxPriorityFeePerGas: '0x59682f00',
    estimatedBaseFee: '0x8',
  },
};

const swapFlowApproveERC20TxMeta = {
  chainId: '0x1',
  origin: process.env.MM_FOX_CODE,
  transaction: {
    from: '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452',
    data: '0x095ea7b3000000000000000000000000881d40237659c251811cec9c364ef91dc08d300c00000000000000000000000000000000000000000000000000000000000f4240',
    gas: '0xdd87',
    nonce: '0x3c',
    to: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    value: '0x0',
    maxFeePerGas: '0x19dd8c2510',
    maxPriorityFeePerGas: '0x9e3311',
    estimatedBaseFee: '0xf36aa15e1',
  },
};
const swapFlowSwapERC20TxMeta = {
  chainId: '0x1',
  origin: process.env.MM_FOX_CODE,
  transaction: {
    from: '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452',
    data: '0x5f5755290000000000000000000000000000000000000000000000000000000000000080000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000000000000000000000000000000000000000f424000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000136f6e65496e6368563546656544796e616d6963000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f42400000000000000000000000000000000000000000000000000000e3cb0338a1e400000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000020d440d83ed000000000000000000000000f326e4de8f66a0bdc0970b79e0924e33c79f1915000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000c80502b1c5000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000000000000000000000000000000000000000f42400000000000000000000000000000000000000000000000000000e5cdc5e9b7a80000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000140000000000000003b5dc1003926a168c11a816e10c13977f75f488bfffe88e4ab4991fe00000000000000000000000000000000000000000000000000bd',
    gas: '0x3dad5',
    nonce: '0x3e',
    to: '0x881d40237659c251811cec9c364ef91dc08d300c',
    value: '0x0',
    maxFeePerGas: '0x1bbbdf536e',
    maxPriorityFeePerGas: '0x120a5d1',
    estimatedBaseFee: '0x104fbb752f',
  },
};
const swapFlowSwapEthTxMeta = {
  chainId: '0x1',
  origin: process.env.MM_FOX_CODE,
  transaction: {
    from: '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452',
    data: '0x5f57552900000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002386f26fc1000000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000136f6e65496e6368563546656544796e616d69630000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000000000000000000000000000000023375dc15608000000000000000000000000000000000000000000000000000000000002477ac5000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000004f94ae6af800000000000000000000000000f326e4de8f66a0bdc0970b79e0924e33c79f1915000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c80502b1c500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000023375dc15608000000000000000000000000000000000000000000000000000000000002477ac40000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000180000000000000003b6d0340b4e16d0168e52d35cacd2c6185b44281ec28c9dcab4991fe000000000000000000000000000000000000000000000000001e',
    gas: '0x333c5',
    nonce: '0x3c',
    to: '0x881d40237659c251811cec9c364ef91dc08d300c',
    value: '0x2386f26fc10000',
    maxFeePerGas: '0x1b6bf7e1c3',
    maxPriorityFeePerGas: '0x200a3b7',
    estimatedBaseFee: '0x1020371570',
  },
};

describe('Transactions utils :: getIsSwapApproveOrSwapTransaction', () => {
  it('returns true if the transaction is an approve tx in the swap flow for ERC20 from token', () => {
    const result = getIsSwapApproveOrSwapTransaction(
      swapFlowApproveERC20TxMeta.transaction.data,
      swapFlowApproveERC20TxMeta.origin,
      swapFlowApproveERC20TxMeta.transaction.to,
      swapFlowApproveERC20TxMeta.chainId,
    );
    expect(result).toBe(true);
  });
  it('returns true if the transaction is a swap tx in the swap flow for ERC20 from token', () => {
    const result = getIsSwapApproveOrSwapTransaction(
      swapFlowSwapERC20TxMeta.transaction.data,
      swapFlowSwapERC20TxMeta.origin,
      swapFlowSwapERC20TxMeta.transaction.to,
      swapFlowSwapERC20TxMeta.chainId,
    );
    expect(result).toBe(true);
  });
  it('returns true if the transaction is a swap tx in the swap flow for ETH from token', () => {
    const result = getIsSwapApproveOrSwapTransaction(
      swapFlowSwapEthTxMeta.transaction.data,
      swapFlowSwapEthTxMeta.origin,
      swapFlowSwapEthTxMeta.transaction.to,
      swapFlowSwapEthTxMeta.chainId,
    );
    expect(result).toBe(true);
  });
  it('returns false if the transaction is a send ERC20 tx', () => {
    const result = getIsSwapApproveOrSwapTransaction(
      sendERC20TxMeta.transaction.data,
      sendERC20TxMeta.origin,
      sendERC20TxMeta.transaction.to,
      sendERC20TxMeta.chainId,
    );
    expect(result).toBe(false);
  });
  it('returns false if the transaction is a send ETH tx', () => {
    const result = getIsSwapApproveOrSwapTransaction(
      sendEthTxMeta.transaction.data,
      sendEthTxMeta.origin,
      sendEthTxMeta.transaction.to,
      sendEthTxMeta.chainId,
    );
    expect(result).toBe(false);
  });
  it('returns false if the transaction is a dapp tx', () => {
    const result = getIsSwapApproveOrSwapTransaction(
      dappTxMeta.transaction.data,
      dappTxMeta.origin,
      dappTxMeta.transaction.to,
      dappTxMeta.chainId,
    );
    expect(result).toBe(false);
  });
});

describe('Transactions utils :: getIsSwapApproveTransaction', () => {
  it('returns true if the transaction is an approve ERC20 tx in the swap flow', () => {
    const result = getIsSwapApproveTransaction(
      swapFlowApproveERC20TxMeta.transaction.data,
      swapFlowApproveERC20TxMeta.origin,
      swapFlowApproveERC20TxMeta.transaction.to,
      swapFlowApproveERC20TxMeta.chainId,
    );
    expect(result).toBe(true);
  });
  it('returns false if the transaction is a swap ERC20 tx in the swap flow', () => {
    const result = getIsSwapApproveTransaction(
      swapFlowSwapERC20TxMeta.transaction.data,
      swapFlowSwapERC20TxMeta.origin,
      swapFlowSwapERC20TxMeta.transaction.to,
      swapFlowSwapERC20TxMeta.chainId,
    );
    expect(result).toBe(false);
  });
  it('returns false if the transaction is a send ETH tx', () => {
    const result = getIsSwapApproveTransaction(
      sendEthTxMeta.transaction.data,
      sendEthTxMeta.origin,
      sendEthTxMeta.transaction.to,
      sendEthTxMeta.chainId,
    );
    expect(result).toBe(false);
  });
  it('returns false if the transaction is a send ERC20 tx', () => {
    const result = getIsSwapApproveTransaction(
      sendERC20TxMeta.transaction.data,
      sendERC20TxMeta.origin,
      sendERC20TxMeta.transaction.to,
      sendERC20TxMeta.chainId,
    );
    expect(result).toBe(false);
  });
  it('returns false if the transaction is a dapp tx', () => {
    const result = getIsSwapApproveTransaction(
      dappTxMeta.transaction.data,
      dappTxMeta.origin,
      dappTxMeta.transaction.to,
      dappTxMeta.chainId,
    );
    expect(result).toBe(false);
  });
});

describe('Transactions utils :: getIsSwapTransaction', () => {
  it('returns false if the transaction is an approve ERC20 tx in the swap flow', () => {
    const result = getIsSwapTransaction(
      swapFlowApproveERC20TxMeta.transaction.data,
      swapFlowApproveERC20TxMeta.origin,
      swapFlowApproveERC20TxMeta.transaction.to,
      swapFlowApproveERC20TxMeta.chainId,
    );
    expect(result).toBe(false);
  });
  it('returns true if the transaction is a swap ERC20 tx in the swap flow', () => {
    const result = getIsSwapTransaction(
      swapFlowSwapERC20TxMeta.transaction.data,
      swapFlowSwapERC20TxMeta.origin,
      swapFlowSwapERC20TxMeta.transaction.to,
      swapFlowSwapERC20TxMeta.chainId,
    );
    expect(result).toBe(true);
  });
  it('returns true if the transaction is a swap ETH tx in the swap flow', () => {
    const result = getIsSwapTransaction(
      swapFlowSwapEthTxMeta.transaction.data,
      swapFlowSwapEthTxMeta.origin,
      swapFlowSwapEthTxMeta.transaction.to,
      swapFlowSwapEthTxMeta.chainId,
    );
    expect(result).toBe(true);
  });
  it('returns false if the transaction is a send tx', () => {
    const result = getIsSwapTransaction(
      sendEthTxMeta.transaction.data,
      sendEthTxMeta.origin,
      sendEthTxMeta.transaction.to,
      sendEthTxMeta.chainId,
    );
    expect(result).toBe(false);
  });
  it('returns false if the transaction is a dapp tx', () => {
    const result = getIsSwapTransaction(
      dappTxMeta.transaction.data,
      dappTxMeta.origin,
      dappTxMeta.transaction.to,
      dappTxMeta.chainId,
    );
    expect(result).toBe(false);
  });
});

describe('Transactions utils :: getIsNativeTokenTransferred', () => {
  it('should return true if the transaction does not have a value of 0x0', () => {
    const tx = {
      nonce: '0x0',
      gasPrice: `0x${new BN('100').toString(16)}`,
      gas: `0x${new BN('21000').toString(16)}`,
      to: '0x0000000000000000000000000000000000000000',
      value: `0x${new BN('10000000000000').toString(16)}`,
      data: '0x0',
    };
    const result = getIsNativeTokenTransferred(tx);
    expect(result).toBe(true);
  });
  it('should return false if the transaction has a value of 0x0', () => {
    const tx = {
      nonce: '0x0',
      gasPrice: `0x${new BN('100').toString(16)}`,
      gas: `0x${new BN('21000').toString(16)}`,
      to: '0x0000000000000000000000000000000000000000',
      value: `0x0`,
      data: '0x0',
    };
    const result = getIsNativeTokenTransferred(tx);
    expect(result).toBe(false);
  });
});

describe('Transactions utils :: getTransactionActionKey', () => {
  it('returns increase allowance method when receiving increase allowance signature', async () => {
    const transaction = {
      txParams: {
        data: `${INCREASE_ALLOWANCE_SIGNATURE}000000000000000000000000000000000000000000000`,
        to: '0xAddress',
      },
    };
    const chainId = '1';

    const actionKey = await getTransactionActionKey(transaction, chainId);
    expect(actionKey).toBe(TOKEN_METHOD_INCREASE_ALLOWANCE);
  });

  it.each([
    TransactionType.stakingClaim,
    TransactionType.stakingDeposit,
    TransactionType.stakingUnstake,
  ])('returns transaction type if type is %s', async (type) => {
    const transaction = { type };
    const chainId = '1';

    const actionKey = await getTransactionActionKey(transaction, chainId);

    expect(actionKey).toBe(type);
  });
});

describe('Transactions utils :: getFourByteSignature', () => {
  const testCases = [
    {
      data: '0xa9059cbb0000000000000000000000002f318C334780961FB129D2a6c30D076E7C9C2fa5',
      expected: '0xa9059cbb',
    },
    {
      data: undefined,
      expected: undefined,
    },
    {
      data: '',
      expected: '',
    },
  ];

  it.each(testCases)(
    `extracts the four-byte signature from transaction data`,
    ({ data, expected }) => {
      expect(getFourByteSignature(data)).toBe(expected);
    },
  );
});

describe('Transactions utils :: isApprovalTransaction', () => {
  const testCases: {
    data: string;
    expectedResult: boolean;
    method: string;
  }[] = [
    {
      data: `${INCREASE_ALLOWANCE_SIGNATURE}0000000000000000000000002f318C334780961FB129D2a6c30D076E7C9C2fa5`,
      expectedResult: true,
      method: 'increaseAllowance',
    },
    {
      data: `${APPROVE_FUNCTION_SIGNATURE}0000000000000000000000002f318C334780961FB129D2a6c30D076E7C9C2fa5`,
      expectedResult: true,
      method: 'approve',
    },
    {
      data: `${SET_APPROVAL_FOR_ALL_SIGNATURE}0000000000000000000000002f318C334780961FB129D2a6c30D076E7C9C2fa5`,
      expectedResult: true,
      method: 'decreaseAllowance',
    },
    {
      data: '0x0a19b14a0000000000000000000000002f318C334780961FB129D2a6c30D076E7C9C2fa5',
      expectedResult: false,
      method: 'otherTransactionType',
    },
  ];

  it.each(testCases)(
    'returns $expectedResult for transaction data: $method',
    ({ data, expectedResult }) => {
      expect(isApprovalTransaction(data)).toBe(expectedResult);
    },
  );
});

describe('Transactions utils :: getTransactionReviewActionKey', () => {
  const transaction = { to: '0x1234567890123456789012345678901234567890' };
  const chainId = '1';
  it('returns `Unknown Method` review action key when transaction action key exists', async () => {
    const expectedReviewActionKey = 'Unknown Method';
    const result = await getTransactionReviewActionKey(
      { transaction },
      chainId,
    );
    expect(result).toEqual(expectedReviewActionKey);
  });

  it('returns correct review action key', async () => {
    const expectedReviewActionKey = 'Increase Allowance';
    const result = await getTransactionReviewActionKey(
      { transaction: { ...transaction, data: INCREASE_ALLOWANCE_SIGNATURE } },
      chainId,
    );
    expect(result).toEqual(expectedReviewActionKey);
  });
});

describe('Transactions utils :: getTransactionById', () => {
  it('returns the correct transaction when given a valid transaction ID', () => {
    const mockTransactions = [
      { id: 'tx1', value: '0x1' },
      { id: 'tx2', value: '0x2' },
      { id: 'tx3', value: '0x3' },
    ];

    const mockTransactionController = {
      state: {
        transactions: mockTransactions,
      },
    };

    const result = getTransactionById('tx2', mockTransactionController);

    expect(result).toEqual(mockTransactions[1]);
  });

  it('returns undefined when given an invalid transaction ID', () => {
    const mockTransactions = [
      { id: 'tx1', value: '0x1' },
      { id: 'tx2', value: '0x2' },
      { id: 'tx3', value: '0x3' },
    ];

    const mockTransactionController = {
      state: {
        transactions: mockTransactions,
      },
    };

    const result = getTransactionById('nonexistent', mockTransactionController);

    expect(result).toBeUndefined();
  });

  it('returns undefined when the transactions array is empty', () => {
    const mockTransactionController = {
      state: {
        transactions: [],
      },
    };

    const result = getTransactionById('tx1', mockTransactionController);

    expect(result).toBeUndefined();
  });
});
