import { REHYDRATE } from 'redux-persist';
import transactionReducer from './index';
import {
  resetTransaction,
  newAssetTransaction,
  setRecipient,
  setSelectedAsset,
  prepareTransaction,
  setTransactionSecurityAlertResponse,
  setTransactionObject,
  setTransactionId,
  setTokensTransaction,
  setEtherTransaction,
  setNonce,
  setProposedNonce,
  setMaxValueMode,
  setTransactionValue,
} from '../../actions/transaction';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const reduce = (state: any, action: any) => transactionReducer(state, action);

const initialState = transactionReducer(undefined, { type: 'UNKNOWN' });

describe('transactionReducer', () => {
  it('returns the initial state for unknown actions', () => {
    expect(initialState).toEqual(
      expect.objectContaining({
        selectedAsset: {},
        securityAlertResponses: {},
        useMax: false,
        transaction: expect.any(Object),
      }),
    );
  });

  it('resets to the initial state on REHYDRATE', () => {
    const state = reduce({ ...initialState, nonce: 5 }, { type: REHYDRATE });
    expect(state).toEqual(initialState);
  });

  it('resets to the initial state on RESET_TRANSACTION', () => {
    const state = reduce({ ...initialState, nonce: 5 }, resetTransaction());
    expect(state).toEqual(initialState);
  });

  it('starts a new asset transaction', () => {
    const asset = { isETH: true, symbol: 'ETH' };
    const state = reduce(
      { ...initialState, nonce: 7 },
      newAssetTransaction(asset),
    );
    expect(state.nonce).toBeUndefined();
    expect(state.selectedAsset).toEqual(asset);
    expect(state.assetType).toBe('ETH');
  });

  it('sets nonce and proposed nonce', () => {
    let state = reduce(initialState, setNonce(3));
    expect(state.nonce).toBe(3);
    state = reduce(state, setProposedNonce(4));
    expect(state.proposedNonce).toBe(4);
  });

  it('sets the recipient', () => {
    const state = reduce(
      initialState,
      setRecipient('0xfrom', '0xto', 'vitalik.eth', 'To Name', 'From Name'),
    );
    expect(state.transaction.from).toBe('0xfrom');
    expect(state.transactionTo).toBe('0xto');
    expect(state.ensRecipient).toBe('vitalik.eth');
    expect(state.transactionToName).toBe('To Name');
    expect(state.transactionFromName).toBe('From Name');
  });

  describe('SET_SELECTED_ASSET', () => {
    it('uses the assetType from the action when present', () => {
      const state = reduce(
        initialState,
        setSelectedAsset({ address: '0x1', symbol: 'DAI' }),
      );
      expect(state.assetType).toBe('ERC20');
      expect(state.selectedAsset).toEqual({ address: '0x1', symbol: 'DAI' });
    });

    it('derives ERC721 asset type for NFTs', () => {
      const state = reduce(
        initialState,
        setSelectedAsset({ address: '0x1', tokenId: '1' }),
      );
      expect(state.assetType).toBe('ERC721');
    });

    it('derives asset type from the asset when not provided', () => {
      const state = reduce(initialState, {
        type: 'SET_SELECTED_ASSET',
        selectedAsset: { isETH: true },
      });
      expect(state.assetType).toBe('ETH');
    });

    it('leaves assetType undefined when no asset is provided', () => {
      const state = reduce(initialState, {
        type: 'SET_SELECTED_ASSET',
        selectedAsset: undefined,
      });
      expect(state.assetType).toBeUndefined();
    });
  });

  it('prepares a transaction', () => {
    const transaction = { from: '0x1', to: '0x2', value: '0x0' };
    const state = reduce(initialState, prepareTransaction(transaction));
    expect(state.transaction).toEqual(transaction);
  });

  describe('SET_TRANSACTION_OBJECT', () => {
    it('merges tx data and meta while retaining security alert responses', () => {
      const withAlerts = {
        ...initialState,
        securityAlertResponses: { tx1: { result_type: 'Benign' } },
      };
      const state = reduce(
        withAlerts,
        setTransactionObject({
          from: '0x1',
          to: '0x2',
          value: '0x5',
          symbol: 'DAI',
          selectedAsset: { address: '0xdai' },
        }),
      );
      expect(state.transaction).toEqual(
        expect.objectContaining({ from: '0x1', to: '0x2', value: '0x5' }),
      );
      expect(state.symbol).toBe('DAI');
      expect(state.assetType).toBe('ERC20');
      expect(state.securityAlertResponses).toEqual({
        tx1: { result_type: 'Benign' },
      });
    });

    it('does not set assetType when no selectedAsset is present', () => {
      const state = reduce(
        initialState,
        setTransactionObject({ from: '0x1', id: 'abc' }),
      );
      expect(state.assetType).toBeUndefined();
      expect(state.id).toBe('abc');
    });
  });

  it('sets tokens transaction', () => {
    const state = reduce(
      initialState,
      setTokensTransaction({ address: '0xtoken', tokenId: '42' }),
    );
    expect(state.selectedAsset).toEqual({ address: '0xtoken', tokenId: '42' });
    expect(state.assetType).toBe('ERC721');
  });

  it('sets ether transaction', () => {
    const state = reduce(
      initialState,
      setEtherTransaction({ from: '0x1', to: '0x2', readableValue: '1' }),
    );
    expect(state.symbol).toBe('ETH');
    expect(state.assetType).toBe('ETH');
    expect(state.selectedAsset).toEqual({ isETH: true, symbol: 'ETH' });
    expect(state.transaction).toEqual({ from: '0x1', to: '0x2' });
    expect(state.readableValue).toBe('1');
  });

  it('stores security alert responses by transaction id', () => {
    let state = reduce(
      initialState,
      setTransactionSecurityAlertResponse('tx1', { result_type: 'Benign' }),
    );
    state = reduce(
      state,
      setTransactionSecurityAlertResponse('tx2', { result_type: 'Malicious' }),
    );
    expect(state.securityAlertResponses).toEqual({
      tx1: { result_type: 'Benign' },
      tx2: { result_type: 'Malicious' },
    });
  });

  it('sets the transaction id', () => {
    const state = reduce(initialState, setTransactionId('tx-id'));
    expect(state.id).toBe('tx-id');
  });

  it('sets max value mode', () => {
    const state = reduce(initialState, setMaxValueMode(true));
    expect((state as { maxValueMode?: boolean }).maxValueMode).toBe(true);
  });

  it('sets the transaction value', () => {
    const state = reduce(
      { ...initialState, transaction: { from: '0x1' } },
      setTransactionValue('0x10'),
    );
    expect(state.transaction).toEqual({ from: '0x1', value: '0x10' });
  });
});
