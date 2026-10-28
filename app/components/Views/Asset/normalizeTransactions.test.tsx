import React from 'react';
import { act, waitFor } from '@testing-library/react-native';
import { TransactionType } from '@metamask/transaction-controller';
import renderWithProvider, {
  DeepPartial,
} from '../../../util/test/renderWithProvider';
import { RootState } from '../../../reducers';
import { backgroundState } from '../../../util/test/initial-root-state';
import {
  MOCK_ACCOUNTS_CONTROLLER_STATE,
  MOCK_ADDRESS_1,
  MOCK_ADDRESS_2,
} from '../../../util/test/accountsControllerTestUtils';
import { updateBgState } from '../../../core/redux/slices/engine';
import { networkIdUpdated } from '../../../core/redux/slices/inpageProvider';
import { sortTransactions } from '../../../util/activity';
import Transactions from '../../UI/Transactions';
import Asset from './';

const SELECTED = MOCK_ADDRESS_2;
const OTHER = MOCK_ADDRESS_1;
const ZERO = '0x0000000000000000000000000000000000000000';

const mockEngineState: Record<string, unknown> = {};

jest.unmock('react-native/Libraries/Interaction/InteractionManager');

jest.mock('../../../util/networks', () => ({
  ...jest.requireActual('../../../util/networks'),
  isPortfolioViewEnabled: jest.fn().mockReturnValue(true),
}));

jest.mock('../../../util/activity', () => ({
  ...jest.requireActual('../../../util/activity'),
  sortTransactions: jest.fn(),
}));

jest.mock('../../UI/AssetOverview', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../UI/Transactions', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../../core/Engine', () => ({
  get state() {
    return mockEngineState;
  },
  context: {
    KeyringController: {
      getOrAddQRKeyring: async () => ({ subscribe: () => ({}) }),
      state: { keyrings: [] },
    },
  },
  controllerMessenger: { subscribe: jest.fn() },
}));

interface MockTx {
  id: string;
  status: string;
  time: number;
  chainId?: string;
  networkID?: string;
  type?: TransactionType;
  txParams: { from: string; to?: string; nonce?: string };
}

const tx = (
  id: string,
  status: string,
  time: number,
  txParams: MockTx['txParams'],
  extra: Partial<MockTx> = {},
): MockTx => ({
  id,
  status,
  time,
  chainId: '0x1',
  networkID: '0x1',
  type: TransactionType.simpleSend,
  txParams,
  ...extra,
});

const buildState = (transactions: MockTx[]) => ({
  swaps: { '0x1': { isLive: true }, hasOnboarded: false, isLive: true },
  fiatOrders: {
    networks: [
      {
        active: true,
        chainId: '1',
        chainName: 'Ethereum Mainnet',
        nativeTokenSupported: true,
      },
    ],
  },
  inpageProvider: { networkId: '0x1' },
  engine: {
    backgroundState: {
      ...backgroundState,
      AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
      NetworkController: {
        selectedNetworkClientId: 'selectedNetworkClientId',
        networkConfigurationsByChainId: {
          '0x1': {
            chainId: '0x1',
            rpcEndpoints: [{ networkClientId: 'selectedNetworkClientId' }],
            defaultRpcEndpointIndex: 0,
            defaultBlockExplorerUrl: 0,
            blockExplorerUrls: ['https://block.com'],
          },
        },
      },
      TransactionController: { transactions },
    },
  },
});

const history: MockTx[] = [
  // confirmed nonce 0x1, `from` lowercase: must still match the selected account
  tx('c1', 'confirmed', 10, {
    from: SELECTED.toLowerCase(),
    to: ZERO,
    nonce: '0x1',
  }),
  // duplicate id: only the first occurrence (after sorting) is kept
  tx('c1', 'confirmed', 9, { from: SELECTED, to: ZERO, nonce: '0x1' }),
  // incoming tx: matched through `to` in upper-case hex
  tx('in1', 'confirmed', 8, {
    from: OTHER,
    to: `0x${SELECTED.slice(2).toUpperCase()}`,
  }),
  tx('p1', 'submitted', 20, { from: SELECTED, to: ZERO, nonce: '0x1' }),
  tx('p2', 'submitted', 21, { from: SELECTED, to: ZERO, nonce: '0x2' }),
  tx('p2b', 'submitted', 19, { from: SELECTED, to: ZERO, nonce: '0x2' }),
  tx('p3', 'pending', 18, { from: SELECTED, to: ZERO, nonce: '0x3' }),
  // submitted to us by another account: excluded from submittedTxs
  tx('s-other', 'submitted', 17, { from: OTHER, to: SELECTED, nonce: '0x2' }),
  // unrelated account, other chain, unapproved, contract deploy w/o `to`
  tx('x1', 'confirmed', 7, { from: OTHER, to: ZERO }),
  tx(
    'x2',
    'confirmed',
    6,
    { from: SELECTED, to: ZERO },
    { chainId: '0x89', networkID: '137' },
  ),
  tx('x3', 'unapproved', 5, { from: SELECTED, to: ZERO }),
  tx('deploy', 'confirmed', 4, { from: SELECTED, nonce: '0x0' }),
];

const lastTransactionsProps = () => {
  const { calls } = (Transactions as unknown as jest.Mock).mock;
  return calls[calls.length - 1][0];
};
const ids = (txs: MockTx[]) => txs.map(({ id }) => id);

const renderAsset = (transactions: MockTx[]) =>
  renderWithProvider(
    <Asset
      navigation={{ setOptions: jest.fn() }}
      route={{
        params: { symbol: 'ETH', address: '', isETH: true, chainId: '0x1' },
      }}
    />,
    { state: buildState(transactions) as unknown as DeepPartial<RootState> },
  );

describe('Asset normalizeTransactions', () => {
  const { sortTransactions: actualSortTransactions } = jest.requireActual(
    '../../../util/activity',
  );

  beforeEach(() => {
    (sortTransactions as jest.Mock).mockImplementation(actualSortTransactions);
    (Transactions as unknown as jest.Mock).mockImplementation(() => null);
    Object.keys(mockEngineState).forEach((key) => delete mockEngineState[key]);
  });

  it('dedups by id and splits submitted / pending / confirmed transactions', async () => {
    renderAsset(history);
    // eslint-disable-next-line no-console

    await waitFor(() =>
      expect(lastTransactionsProps().transactions.length).toBeGreaterThan(0),
    );
    const props = lastTransactionsProps();

    expect(ids(props.transactions)).toEqual(['p3', 'c1', 'in1', 'deploy']);
    expect(ids(props.confirmedTransactions)).toEqual(['c1', 'in1', 'deploy']);
    // p1 reuses confirmed nonce 0x1; p2b reuses p2's nonce; s-other is not ours
    expect(ids(props.submittedTransactions)).toEqual(['p2']);
  });

  it('does not re-normalize on unrelated prop changes', async () => {
    const { store } = renderAsset(history);
    await waitFor(() =>
      expect(lastTransactionsProps().transactions.length).toBeGreaterThan(0),
    );
    const sortCalls = (sortTransactions as jest.Mock).mock.calls.length;

    mockEngineState.CurrencyRateController = {
      ...backgroundState.CurrencyRateController,
      currentCurrency: 'eur',
    };
    act(() => {
      store.dispatch(updateBgState({ key: 'CurrencyRateController' }));
    });

    await waitFor(() =>
      expect(lastTransactionsProps().currentCurrency).toBe('eur'),
    );
    expect((sortTransactions as jest.Mock).mock.calls.length).toBe(sortCalls);
  });

  it('re-normalizes when the transaction history changes', async () => {
    const { store } = renderAsset(history);
    await waitFor(() =>
      expect(lastTransactionsProps().transactions.length).toBeGreaterThan(0),
    );
    const sortCalls = (sortTransactions as jest.Mock).mock.calls.length;

    mockEngineState.TransactionController = {
      transactions: [
        tx('new', 'confirmed', 30, { from: SELECTED, to: ZERO, nonce: '0x4' }),
        ...history,
      ],
    };
    act(() => {
      store.dispatch(updateBgState({ key: 'TransactionController' }));
    });

    await waitFor(() =>
      expect(ids(lastTransactionsProps().transactions)).toEqual([
        'new',
        'p3',
        'c1',
        'in1',
        'deploy',
      ]),
    );
    expect((sortTransactions as jest.Mock).mock.calls.length).toBe(
      sortCalls + 1,
    );
  });

  it('re-normalizes legacy transactions when the network id changes', async () => {
    const legacy = tx(
      'legacy',
      'confirmed',
      3,
      { from: SELECTED, to: ZERO },
      { chainId: undefined, networkID: '123' },
    );
    const { store } = renderAsset([...history, legacy]);
    await waitFor(() =>
      expect(lastTransactionsProps().transactions.length).toBeGreaterThan(0),
    );
    expect(ids(lastTransactionsProps().transactions)).not.toContain('legacy');

    act(() => {
      store.dispatch(networkIdUpdated('123'));
    });

    await waitFor(() =>
      expect(ids(lastTransactionsProps().transactions)).toContain('legacy'),
    );
  });
});
