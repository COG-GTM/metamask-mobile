import { GAS_ESTIMATE_TYPES } from '@metamask/gas-fee-controller';
import { mergeGasFeeEstimates } from '@metamask/transaction-controller';
import {
  selectGasFeeControllerEstimateType,
  selectGasFeeControllerEstimates,
  selectGasFeeEstimatesByChainId,
} from './gasFeeController';
import { RootState } from '../reducers';

jest.mock('@metamask/transaction-controller', () => ({
  ...jest.requireActual('@metamask/transaction-controller'),
  mergeGasFeeEstimates: jest.fn(),
}));

const CHAIN_ID_MAINNET = '0x1';
const CHAIN_ID_SEPOLIA = '0xaa36a7';
const TRANSACTION_ID = 'tx-1';

const CONTROLLER_ESTIMATES_MAINNET = {
  low: { suggestedMaxFeePerGas: '1', suggestedMaxPriorityFeePerGas: '1' },
  medium: { suggestedMaxFeePerGas: '2', suggestedMaxPriorityFeePerGas: '2' },
  high: { suggestedMaxFeePerGas: '3', suggestedMaxPriorityFeePerGas: '3' },
  estimatedBaseFee: '1',
};

const CONTROLLER_ESTIMATES_SEPOLIA = {
  low: { suggestedMaxFeePerGas: '10', suggestedMaxPriorityFeePerGas: '10' },
  medium: { suggestedMaxFeePerGas: '20', suggestedMaxPriorityFeePerGas: '20' },
  high: { suggestedMaxFeePerGas: '30', suggestedMaxPriorityFeePerGas: '30' },
  estimatedBaseFee: '10',
};

const TRANSACTION_ESTIMATES = {
  type: 'fee-market',
  low: { maxFeePerGas: '0x5', maxPriorityFeePerGas: '0x1' },
  medium: { maxFeePerGas: '0x6', maxPriorityFeePerGas: '0x2' },
  high: { maxFeePerGas: '0x7', maxPriorityFeePerGas: '0x3' },
};

const MERGED_ESTIMATES = { merged: true };

interface BuildStateOptions {
  pendingApprovalIds?: string[];
  transactions?: Record<string, unknown>[];
}

function buildState({
  pendingApprovalIds = [],
  transactions = [],
}: BuildStateOptions = {}) {
  const pendingApprovals = Object.fromEntries(
    pendingApprovalIds.map((id) => [id, { id }]),
  );

  return {
    engine: {
      backgroundState: {
        GasFeeController: {
          gasFeeEstimatesByChainId: {
            [CHAIN_ID_MAINNET]: {
              gasFeeEstimates: CONTROLLER_ESTIMATES_MAINNET,
            },
            [CHAIN_ID_SEPOLIA]: {
              gasFeeEstimates: CONTROLLER_ESTIMATES_SEPOLIA,
            },
          },
        },
        ApprovalController: { pendingApprovals },
        TransactionController: { transactions },
      },
    },
  } as unknown as RootState;
}

describe('GasFeeController Selectors', () => {
  describe('selectGasFeeControllerEstimates', () => {
    it('returns the gas estimate type from GasFeeController state', () => {
      const gasFeeEstimates = { low: '1', medium: '2', high: '3' };

      const state = {
        engine: {
          backgroundState: {
            GasFeeController: {
              gasFeeEstimates,
            },
          },
        },
      };

      expect(
        selectGasFeeControllerEstimates(state as unknown as RootState),
      ).toStrictEqual(gasFeeEstimates);
    });
  });

  describe('selectGasFeeControllerEstimateType', () => {
    it('returns the gas estimate type from GasFeeController state', () => {
      const gasEstimateType = GAS_ESTIMATE_TYPES.FEE_MARKET;

      const state = {
        engine: {
          backgroundState: {
            GasFeeController: {
              gasEstimateType,
            },
          },
        },
      };

      expect(
        selectGasFeeControllerEstimateType(state as RootState),
      ).toStrictEqual(gasEstimateType);
    });
  });

  describe('selectGasFeeEstimatesByChainId', () => {
    const mergeGasFeeEstimatesMock = jest.mocked(mergeGasFeeEstimates);

    beforeEach(() => {
      mergeGasFeeEstimatesMock.mockReset();
      mergeGasFeeEstimatesMock.mockReturnValue(
        MERGED_ESTIMATES as unknown as ReturnType<typeof mergeGasFeeEstimates>,
      );
    });

    it('returns controller estimates when there is no pending approval', () => {
      const state = buildState();

      expect(
        selectGasFeeEstimatesByChainId(state, CHAIN_ID_MAINNET),
      ).toStrictEqual(CONTROLLER_ESTIMATES_MAINNET);
      expect(mergeGasFeeEstimatesMock).not.toHaveBeenCalled();
    });

    it('returns controller estimates when the pending approval has no transaction', () => {
      const state = buildState({ pendingApprovalIds: [TRANSACTION_ID] });

      expect(
        selectGasFeeEstimatesByChainId(state, CHAIN_ID_MAINNET),
      ).toStrictEqual(CONTROLLER_ESTIMATES_MAINNET);
      expect(mergeGasFeeEstimatesMock).not.toHaveBeenCalled();
    });

    it('merges transaction estimates when the pending transaction is on the requested chain', () => {
      const state = buildState({
        pendingApprovalIds: [TRANSACTION_ID],
        transactions: [
          {
            id: TRANSACTION_ID,
            chainId: CHAIN_ID_MAINNET,
            gasFeeEstimates: TRANSACTION_ESTIMATES,
          },
        ],
      });

      expect(
        selectGasFeeEstimatesByChainId(state, CHAIN_ID_MAINNET),
      ).toStrictEqual(MERGED_ESTIMATES);
      expect(mergeGasFeeEstimatesMock).toHaveBeenCalledTimes(1);
      expect(mergeGasFeeEstimatesMock).toHaveBeenCalledWith({
        gasFeeControllerEstimates: CONTROLLER_ESTIMATES_MAINNET,
        transactionGasFeeEstimates: TRANSACTION_ESTIMATES,
      });
    });

    it('returns controller estimates only when the pending transaction is on another chain', () => {
      const state = buildState({
        pendingApprovalIds: [TRANSACTION_ID],
        transactions: [
          {
            id: TRANSACTION_ID,
            chainId: CHAIN_ID_MAINNET,
            gasFeeEstimates: TRANSACTION_ESTIMATES,
          },
        ],
      });

      expect(
        selectGasFeeEstimatesByChainId(state, CHAIN_ID_SEPOLIA),
      ).toStrictEqual(CONTROLLER_ESTIMATES_SEPOLIA);
      expect(mergeGasFeeEstimatesMock).not.toHaveBeenCalled();
    });

    it('returns controller estimates when the pending transaction on the requested chain has no estimates', () => {
      const state = buildState({
        pendingApprovalIds: [TRANSACTION_ID],
        transactions: [{ id: TRANSACTION_ID, chainId: CHAIN_ID_MAINNET }],
      });

      expect(
        selectGasFeeEstimatesByChainId(state, CHAIN_ID_MAINNET),
      ).toStrictEqual(CONTROLLER_ESTIMATES_MAINNET);
      expect(mergeGasFeeEstimatesMock).not.toHaveBeenCalled();
    });

    it('uses the first pending approval to pick the transaction', () => {
      const state = buildState({
        pendingApprovalIds: [TRANSACTION_ID, 'tx-2'],
        transactions: [
          { id: 'tx-2', chainId: CHAIN_ID_MAINNET, gasFeeEstimates: {} },
          {
            id: TRANSACTION_ID,
            chainId: CHAIN_ID_MAINNET,
            gasFeeEstimates: TRANSACTION_ESTIMATES,
          },
        ],
      });

      selectGasFeeEstimatesByChainId(state, CHAIN_ID_MAINNET);

      expect(mergeGasFeeEstimatesMock).toHaveBeenCalledWith({
        gasFeeControllerEstimates: CONTROLLER_ESTIMATES_MAINNET,
        transactionGasFeeEstimates: TRANSACTION_ESTIMATES,
      });
    });

    it('returns undefined when there is no controller entry for the chain', () => {
      const state = buildState();

      expect(selectGasFeeEstimatesByChainId(state, '0x89')).toBeUndefined();
      expect(mergeGasFeeEstimatesMock).not.toHaveBeenCalled();
    });
  });
});
