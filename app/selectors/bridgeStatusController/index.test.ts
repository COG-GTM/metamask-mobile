import { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { RootState } from '../../reducers';
import {
  createMockAccountsControllerState,
  MOCK_ADDRESS_1,
  MOCK_ADDRESS_2,
} from '../../util/test/accountsControllerTestUtils';
import { selectBridgeHistoryForAccount, selectBridgeStatusState } from '.';

const SELECTED_ADDRESS = MOCK_ADDRESS_1.toLowerCase();
const OTHER_ADDRESS = MOCK_ADDRESS_2.toLowerCase();

const createHistoryItem = (txMetaId: string, account: string) =>
  ({
    txMetaId,
    account,
    quote: { srcChainId: 1, destChainId: 10 },
    startTime: 1729964825189,
    estimatedProcessingTimeInSeconds: 15,
    slippagePercentage: 0,
    hasApprovalTx: false,
    status: { status: 'PENDING', srcChain: { chainId: 1 } },
  } as unknown as BridgeHistoryItem);

const createState = (
  bridgeStatusControllerState: unknown,
  selectedAddress: string = SELECTED_ADDRESS,
) =>
  ({
    engine: {
      backgroundState: {
        AccountsController: createMockAccountsControllerState(
          [SELECTED_ADDRESS, OTHER_ADDRESS],
          selectedAddress,
        ),
        BridgeStatusController: bridgeStatusControllerState,
      },
    },
  } as unknown as RootState);

describe('bridgeStatusController selectors', () => {
  describe('selectBridgeStatusState', () => {
    it('returns the BridgeStatusController background state', () => {
      const bridgeStatusState = { txHistory: {} };

      expect(selectBridgeStatusState(createState(bridgeStatusState))).toBe(
        bridgeStatusState,
      );
    });
  });

  describe('selectBridgeHistoryForAccount', () => {
    it('returns an empty object when BridgeStatusController state is undefined', () => {
      expect(selectBridgeHistoryForAccount(createState(undefined))).toEqual({});
    });

    it('returns an empty object when txHistory is missing', () => {
      expect(selectBridgeHistoryForAccount(createState({}))).toEqual({});
    });

    it('returns an empty object when txHistory is empty', () => {
      expect(
        selectBridgeHistoryForAccount(createState({ txHistory: {} })),
      ).toEqual({});
    });

    it('returns only the history items of the selected account', () => {
      const selectedItem1 = createHistoryItem('tx-1', SELECTED_ADDRESS);
      const otherItem = createHistoryItem('tx-2', OTHER_ADDRESS);
      const selectedItem2 = createHistoryItem('tx-3', SELECTED_ADDRESS);

      const result = selectBridgeHistoryForAccount(
        createState({
          txHistory: {
            'tx-1': selectedItem1,
            'tx-2': otherItem,
            'tx-3': selectedItem2,
          },
        }),
      );

      expect(result).toEqual({ 'tx-1': selectedItem1, 'tx-3': selectedItem2 });
      expect(result['tx-1']).toBe(selectedItem1);
    });

    it('returns the other account items when that account is selected', () => {
      const selectedItem = createHistoryItem('tx-1', SELECTED_ADDRESS);
      const otherItem = createHistoryItem('tx-2', OTHER_ADDRESS);

      const result = selectBridgeHistoryForAccount(
        createState(
          { txHistory: { 'tx-1': selectedItem, 'tx-2': otherItem } },
          OTHER_ADDRESS,
        ),
      );

      expect(result).toEqual({ 'tx-2': otherItem });
    });

    it('returns an empty object when no item belongs to the selected account', () => {
      const result = selectBridgeHistoryForAccount(
        createState({
          txHistory: { 'tx-2': createHistoryItem('tx-2', OTHER_ADDRESS) },
        }),
      );

      expect(result).toEqual({});
    });

    // Addresses are compared exactly: non-EVM (e.g. Solana base58) addresses are
    // case-sensitive, so history must store the same casing as the selected account.
    it('excludes items whose account differs from the selected address only by casing', () => {
      const checksummedItem = createHistoryItem('tx-1', MOCK_ADDRESS_1);
      const lowercaseItem = createHistoryItem('tx-2', SELECTED_ADDRESS);

      const result = selectBridgeHistoryForAccount(
        createState({
          txHistory: { 'tx-1': checksummedItem, 'tx-2': lowercaseItem },
        }),
      );

      expect(MOCK_ADDRESS_1).not.toBe(SELECTED_ADDRESS);
      expect(result).toEqual({ 'tx-2': lowercaseItem });
    });

    it('returns the memoized result for the same inputs', () => {
      const state = createState({
        txHistory: { 'tx-1': createHistoryItem('tx-1', SELECTED_ADDRESS) },
      });

      expect(selectBridgeHistoryForAccount(state)).toBe(
        selectBridgeHistoryForAccount(state),
      );
    });
  });
});
