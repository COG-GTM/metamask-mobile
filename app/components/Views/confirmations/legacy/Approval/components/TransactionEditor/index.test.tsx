import React from 'react';
import TransactionEditor from '.';
import configureMockStore from 'redux-mock-store';
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';
import { act, waitFor } from '@testing-library/react-native';
import { GAS_ESTIMATE_TYPES } from '@metamask/gas-fee-controller';
import { backgroundState } from '../../../../../../../util/test/initial-root-state';
import renderWithProvider from '../../../../../../../util/test/renderWithProvider';
import Engine from '../../../../../../../core/Engine';
import { handleGetGasLimit } from '../../../../../../../util/dappTransactions';
import {
  parseTransactionEIP1559,
  parseTransactionLegacy,
} from '../../../../../../../util/transactions';
import { fromWei, hexToBN } from '../../../../../../../util/number';
import { safeToChecksumAddress } from '../../../../../../../util/address';

const mockTransactionReview = jest.fn();

jest.mock('../../../components/TransactionReview', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockTransactionReview(props);
    return null;
  },
}));

jest.mock('../../../../../../UI/AnimatedTransactionModal', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../../../../../../../core/Engine', () => ({
  context: {
    GasFeeController: {
      getGasFeeEstimatesAndStartPolling: jest.fn(),
      stopPolling: jest.fn(),
    },
  },
}));

jest.mock('../../../../../../../util/dappTransactions', () => ({
  ...jest.requireActual('../../../../../../../util/dappTransactions'),
  handleGetGasLimit: jest.fn(),
}));

jest.mock('../../../../../../../util/transactions', () => {
  const actual = jest.requireActual('../../../../../../../util/transactions');
  return {
    ...actual,
    parseTransactionEIP1559: jest.fn(actual.parseTransactionEIP1559),
    parseTransactionLegacy: jest.fn(actual.parseTransactionLegacy),
  };
});

const mockStore = configureMockStore();
const initialState = {
  engine: {
    backgroundState,
  },
  transaction: {
    value: 0,
    data: '0x0',
    gas: 0,
    gasPrice: 1,
    from: '0x0',
    to: '0x1',
  },
  settings: {
    primaryCurrency: 'fiat',
  },
};
const store = mockStore(initialState);

describe('TransactionEditor', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <TransactionEditor />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });

  describe('componentDidMount gas initialisation', () => {
    const POLL_TOKEN = 'poll-token';
    const FROM = '0xc4955c0d639d99699bfd7ec54d9fafee40e4d272';
    const GAS_LIMIT = hexToBN('0x5208');
    // 30 gwei / 2 gwei / 25 gwei in wei
    const MAX_FEE_PER_GAS = '0x6fc23ac00';
    const MAX_PRIORITY_FEE_PER_GAS = '0x77359400';
    const GAS_PRICE = '0x5d21dba00';

    const feeMarketEstimates = {
      low: {
        suggestedMaxFeePerGas: '10',
        suggestedMaxPriorityFeePerGas: '1',
        minWaitTimeEstimate: 30000,
        maxWaitTimeEstimate: 60000,
      },
      medium: {
        suggestedMaxFeePerGas: '20',
        suggestedMaxPriorityFeePerGas: '1.5',
        minWaitTimeEstimate: 15000,
        maxWaitTimeEstimate: 45000,
      },
      high: {
        suggestedMaxFeePerGas: '40',
        suggestedMaxPriorityFeePerGas: '3',
        minWaitTimeEstimate: 10000,
        maxWaitTimeEstimate: 30000,
      },
      estimatedBaseFee: '15',
    };

    const legacyEstimates = { low: '10', medium: '20', high: '40' };

    const { GasFeeController } = Engine.context as unknown as {
      GasFeeController: {
        getGasFeeEstimatesAndStartPolling: jest.Mock;
        stopPolling: jest.Mock;
      };
    };
    const mockHandleGetGasLimit = handleGetGasLimit as jest.Mock;
    const mockParseTransactionEIP1559 = parseTransactionEIP1559 as jest.Mock;
    const mockParseTransactionLegacy = parseTransactionLegacy as jest.Mock;

    const renderEditor = (
      txParams: Record<string, unknown>,
      gasEstimateType:
        | typeof GAS_ESTIMATE_TYPES.FEE_MARKET
        | typeof GAS_ESTIMATE_TYPES.LEGACY = GAS_ESTIMATE_TYPES.FEE_MARKET,
    ) =>
      renderWithProvider(<TransactionEditor mode="review" />, {
        state: {
          engine: {
            backgroundState: {
              ...backgroundState,
              AccountTrackerController: {
                ...backgroundState.AccountTrackerController,
                accountsByChainId: {
                  '0x1': {
                    [safeToChecksumAddress(FROM) as string]: {
                      // 10 ETH
                      balance: '0x8ac7230489e80000',
                    },
                  },
                },
              },
              GasFeeController: {
                ...backgroundState.GasFeeController,
                gasEstimateType,
                gasFeeEstimates:
                  gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET
                    ? feeMarketEstimates
                    : legacyEstimates,
              },
            },
          },
          settings: { primaryCurrency: 'ETH' },
          transaction: {
            selectedAsset: {},
            transaction: {
              from: FROM,
              to: '0x0000000000000000000000000000000000000001',
              chainId: '0x1',
              ...txParams,
            },
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      });

    const lastReviewProps = () =>
      mockTransactionReview.mock.calls[
        mockTransactionReview.mock.calls.length - 1
      ][0];

    const firstSelectedGasFee = (mockFn: jest.Mock) =>
      mockFn.mock.calls[0][0].selectedGasFee;

    beforeEach(() => {
      jest.clearAllMocks();
      GasFeeController.getGasFeeEstimatesAndStartPolling.mockResolvedValue(
        POLL_TOKEN,
      );
    });

    describe('gas limit estimation', () => {
      it('estimates the gas limit when the dapp transaction has no gas', async () => {
        renderEditor({ gasPrice: GAS_PRICE });

        await waitFor(() =>
          expect(
            GasFeeController.getGasFeeEstimatesAndStartPolling,
          ).toHaveBeenCalled(),
        );
        expect(mockHandleGetGasLimit).toHaveBeenCalledTimes(1);
        const [txArg, setTransactionObjectArg] =
          mockHandleGetGasLimit.mock.calls[0];
        expect(txArg.gas).toBeUndefined();
        expect(txArg.gasPrice).toBe(GAS_PRICE);
        expect(setTransactionObjectArg).toEqual(expect.any(Function));
      });

      it('estimates the gas limit when the dapp transaction gas is 0x0', async () => {
        // RootRPCMethodsUI converts txParams.gas with hexToBN before it reaches the editor
        const zeroGas = hexToBN('0x0');
        renderEditor({ gas: zeroGas, gasPrice: GAS_PRICE });

        await waitFor(() =>
          expect(
            GasFeeController.getGasFeeEstimatesAndStartPolling,
          ).toHaveBeenCalled(),
        );
        expect(mockHandleGetGasLimit).toHaveBeenCalledTimes(1);
        expect(mockHandleGetGasLimit.mock.calls[0][0].gas.isZero()).toBe(true);
        expect(mockHandleGetGasLimit.mock.calls[0][1]).toEqual(
          expect.any(Function),
        );
      });

      it('passes a setTransactionObject callback that updates the transaction gas', async () => {
        const { store: reduxStore } = renderEditor({
          gas: hexToBN('0x0'),
          gasPrice: GAS_PRICE,
        });

        await waitFor(() => expect(mockHandleGetGasLimit).toHaveBeenCalled());
        const setTransactionObject = mockHandleGetGasLimit.mock.calls[0][1];
        await act(async () => {
          setTransactionObject({ gas: GAS_LIMIT });
        });

        expect(
          reduxStore.getState().transaction.transaction.gas.toString(16),
        ).toBe('5208');
      });

      it('does not estimate the gas limit when the dapp provides a non-zero gas', async () => {
        renderEditor({ gas: GAS_LIMIT, gasPrice: GAS_PRICE });

        await waitFor(() =>
          expect(
            GasFeeController.getGasFeeEstimatesAndStartPolling,
          ).toHaveBeenCalled(),
        );
        expect(mockHandleGetGasLimit).not.toHaveBeenCalled();
      });
    });

    describe('gas fee seeding', () => {
      it('only polls for estimates when the dapp suggests no gas fees', async () => {
        renderEditor({ gas: GAS_LIMIT });

        await waitFor(() =>
          expect(mockParseTransactionEIP1559).toHaveBeenCalled(),
        );
        expect(
          GasFeeController.getGasFeeEstimatesAndStartPolling,
        ).toHaveBeenCalledTimes(1);
        expect(
          GasFeeController.getGasFeeEstimatesAndStartPolling,
        ).toHaveBeenCalledWith(undefined);
        expect(firstSelectedGasFee(mockParseTransactionEIP1559)).toEqual(
          expect.objectContaining({
            suggestedMaxFeePerGas:
              feeMarketEstimates.medium.suggestedMaxFeePerGas,
            suggestedMaxPriorityFeePerGas:
              feeMarketEstimates.medium.suggestedMaxPriorityFeePerGas,
          }),
        );
        await waitFor(() =>
          expect(lastReviewProps()).toEqual(
            expect.objectContaining({
              dappSuggestedGas: false,
              dappSuggestedGasWarning: false,
              gasSelected: 'medium',
            }),
          ),
        );
      });

      it('seeds dappSuggestedEIP1559Gas from maxFeePerGas and maxPriorityFeePerGas and starts polling', async () => {
        renderEditor({
          gas: GAS_LIMIT,
          maxFeePerGas: MAX_FEE_PER_GAS,
          maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
        });

        await waitFor(() =>
          expect(mockParseTransactionEIP1559).toHaveBeenCalled(),
        );
        expect(
          GasFeeController.getGasFeeEstimatesAndStartPolling,
        ).toHaveBeenCalledTimes(1);
        expect(firstSelectedGasFee(mockParseTransactionEIP1559)).toEqual(
          expect.objectContaining({
            suggestedMaxFeePerGas: fromWei(MAX_FEE_PER_GAS, 'gwei'),
            suggestedMaxPriorityFeePerGas: fromWei(
              MAX_PRIORITY_FEE_PER_GAS,
              'gwei',
            ),
          }),
        );
        expect(fromWei(MAX_FEE_PER_GAS, 'gwei')).toBe('30');
        expect(fromWei(MAX_PRIORITY_FEE_PER_GAS, 'gwei')).toBe('2');
        await waitFor(() =>
          expect(lastReviewProps()).toEqual(
            expect.objectContaining({
              dappSuggestedGas: true,
              dappSuggestedGasWarning: false,
              gasSelected: null,
            }),
          ),
        );
      });

      it('does not seed dappSuggestedEIP1559Gas when only maxFeePerGas is provided', async () => {
        renderEditor({ gas: GAS_LIMIT, maxFeePerGas: MAX_FEE_PER_GAS });

        await waitFor(() =>
          expect(mockParseTransactionEIP1559).toHaveBeenCalled(),
        );
        expect(firstSelectedGasFee(mockParseTransactionEIP1559)).toEqual(
          expect.objectContaining({
            suggestedMaxFeePerGas:
              feeMarketEstimates.medium.suggestedMaxFeePerGas,
          }),
        );
        await waitFor(() =>
          expect(lastReviewProps()).toEqual(
            expect.objectContaining({ dappSuggestedGas: false }),
          ),
        );
      });

      it('prefers dapp-suggested EIP-1559 fees over a dapp-suggested gasPrice', async () => {
        renderEditor({
          gas: GAS_LIMIT,
          gasPrice: GAS_PRICE,
          maxFeePerGas: MAX_FEE_PER_GAS,
          maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
        });

        await waitFor(() =>
          expect(mockParseTransactionEIP1559).toHaveBeenCalled(),
        );
        expect(firstSelectedGasFee(mockParseTransactionEIP1559)).toEqual(
          expect.objectContaining({
            suggestedMaxFeePerGas: '30',
            suggestedMaxPriorityFeePerGas: '2',
          }),
        );
        await waitFor(() =>
          expect(lastReviewProps()).toEqual(
            expect.objectContaining({
              dappSuggestedGas: true,
              dappSuggestedGasWarning: false,
            }),
          ),
        );
      });

      it('seeds dappSuggestedGasPrice from gasPrice and starts polling on a fee-market network', async () => {
        renderEditor({ gas: GAS_LIMIT, gasPrice: GAS_PRICE });

        await waitFor(() =>
          expect(mockParseTransactionEIP1559).toHaveBeenCalled(),
        );
        expect(
          GasFeeController.getGasFeeEstimatesAndStartPolling,
        ).toHaveBeenCalledTimes(1);
        expect(firstSelectedGasFee(mockParseTransactionEIP1559)).toEqual(
          expect.objectContaining({
            suggestedMaxFeePerGas: '25',
            suggestedMaxPriorityFeePerGas: '25',
          }),
        );
        await waitFor(() =>
          expect(lastReviewProps()).toEqual(
            expect.objectContaining({
              dappSuggestedGas: true,
              dappSuggestedGasWarning: true,
              gasSelected: null,
            }),
          ),
        );
      });

      it('seeds dappSuggestedGasPrice from gasPrice on a legacy network', async () => {
        renderEditor(
          { gas: GAS_LIMIT, gasPrice: GAS_PRICE },
          GAS_ESTIMATE_TYPES.LEGACY,
        );

        await waitFor(() =>
          expect(mockParseTransactionLegacy).toHaveBeenCalled(),
        );
        expect(mockParseTransactionEIP1559).not.toHaveBeenCalled();
        expect(firstSelectedGasFee(mockParseTransactionLegacy)).toEqual(
          expect.objectContaining({ suggestedGasPrice: '25' }),
        );
        await waitFor(() =>
          expect(lastReviewProps()).toEqual(
            expect.objectContaining({
              dappSuggestedGas: true,
              dappSuggestedGasWarning: false,
              gasSelected: null,
            }),
          ),
        );
      });

      it('uses the polled legacy estimate when the dapp suggests no gasPrice on a legacy network', async () => {
        renderEditor({ gas: GAS_LIMIT }, GAS_ESTIMATE_TYPES.LEGACY);

        await waitFor(() =>
          expect(mockParseTransactionLegacy).toHaveBeenCalled(),
        );
        expect(firstSelectedGasFee(mockParseTransactionLegacy)).toEqual(
          expect.objectContaining({
            suggestedGasPrice: legacyEstimates.medium,
          }),
        );
        await waitFor(() =>
          expect(lastReviewProps()).toEqual(
            expect.objectContaining({
              dappSuggestedGas: false,
              gasSelected: 'medium',
            }),
          ),
        );
      });

      it('stops polling with the token returned by the GasFeeController on unmount', async () => {
        const { unmount } = renderEditor({
          gas: GAS_LIMIT,
          gasPrice: GAS_PRICE,
        });

        await waitFor(() =>
          expect(
            GasFeeController.getGasFeeEstimatesAndStartPolling,
          ).toHaveBeenCalled(),
        );
        await waitFor(() =>
          expect(mockParseTransactionEIP1559).toHaveBeenCalled(),
        );
        unmount();

        expect(GasFeeController.stopPolling).toHaveBeenCalledWith(POLL_TOKEN);
      });
    });
  });
});
