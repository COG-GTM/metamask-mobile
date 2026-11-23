import React from 'react';
import { FlatList } from 'react-native';
import { act } from '@testing-library/react-native';
import CollectibleContracts from './';
import renderWithProvider, {
  DeepPartial,
} from '../../../util/test/renderWithProvider';
import { backgroundState } from '../../../util/test/initial-root-state';
import { RootState } from '../../../reducers';
import { mockNetworkState } from '../../../util/test/network';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { PreferencesState } from '@metamask/preferences-controller';
import { createMockAccountsControllerState } from '../../../util/test/accountsControllerTestUtils';
// eslint-disable-next-line import/no-namespace
import * as collectibleSelectors from '../../../reducers/collectibles';
import { SHOW_NFT_FETCHING_LOADER } from '../../../reducers/collectibles';
// eslint-disable-next-line import/no-namespace
import * as networkSelectors from '../../../selectors/networkController';

interface MockElementProps {
  asset: { address?: string; name: string; favorites?: boolean };
  contractCollectibles: unknown[];
  collectiblesVisible: boolean;
}

const mockElementRenders: MockElementProps[] = [];

jest.mock('../CollectibleContractElement', () => {
  const ReactActual = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');
  // The real element is wrapped in connect(), which memoizes on shallow props.
  return {
    __esModule: true,
    default: ReactActual.memo((props: MockElementProps) => {
      mockElementRenders.push(props);
      return ReactActual.createElement(Text, null, props.asset.name);
    }),
  };
});

jest.mock('../../../components/hooks/useMetrics', () => ({
  useMetrics: () => ({
    trackEvent: jest.fn(),
    createEventBuilder: jest.fn(),
  }),
}));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('../../../core/Engine', () => ({
  context: {
    NftController: {
      state: { allNfts: {}, allNftContracts: {}, ignoredNfts: [] },
      updateNftMetadata: jest.fn(),
      checkAndUpdateAllNftsOwnershipStatus: jest.fn(),
    },
    NftDetectionController: { detectNfts: jest.fn() },
  },
}));

const MOCK_ADDRESS = '0xd018538C87232FF95acbCe4870629b75640a78E7';

const mockState: DeepPartial<RootState> = {
  collectibles: { favorites: {}, isNftFetchingProgress: false },
  engine: {
    backgroundState: {
      ...backgroundState,
      NetworkController: {
        ...mockNetworkState({
          chainId: CHAIN_IDS.MAINNET,
          id: 'mainnet',
          nickname: 'Ethereum Mainnet',
          ticker: 'ETH',
        }),
      },
      PreferencesController: {
        useNftDetection: true,
        displayNftMedia: true,
      } as unknown as PreferencesState,
      AccountsController: createMockAccountsControllerState([MOCK_ADDRESS]),
    },
  },
};

const contractAddress = (i: number) =>
  `0x${i.toString(16).padStart(4, '0')}AbCdEf0000000000000000000000000000`;

const buildData = (contractCount: number, nftsPerContract: number) => {
  let addressReads = 0;
  const contracts = Array.from({ length: contractCount }, (_, i) => ({
    address: contractAddress(i),
    name: `Contract ${i}`,
  }));
  const nfts = contracts.flatMap((contract, i) =>
    Array.from({ length: nftsPerContract }, (_, j) => {
      // NFT addresses use a different case than the contract address.
      const address = j % 2 ? contract.address.toLowerCase() : contract.address;
      const nft = {
        name: `NFT ${i}-${j}`,
        tokenId: `${j}`,
        isCurrentlyOwned: true,
      };
      Object.defineProperty(nft, 'address', {
        enumerable: true,
        get: () => {
          addressReads += 1;
          return address;
        },
      });
      return nft as typeof nft & { address: string };
    }),
  );
  return { contracts, nfts, getAddressReads: () => addressReads };
};

const mockSelectors = (
  contracts: unknown[],
  nfts: unknown[],
  favorites: unknown[] = [],
) => {
  jest
    .spyOn(collectibleSelectors, 'multichainCollectibleContractsSelector')
    .mockReturnValue({ '0x1': contracts });
  jest
    .spyOn(collectibleSelectors, 'multichainCollectiblesSelector')
    .mockReturnValue({ '0x1': nfts });
  jest
    .spyOn(collectibleSelectors, 'favoritesCollectiblesSelector')
    .mockReturnValue(favorites);
};

const rowRenders = () => mockElementRenders.filter((p) => !p.asset.favorites);

describe('CollectibleContracts rows', () => {
  beforeEach(() => {
    mockElementRenders.length = 0;
    jest.restoreAllMocks();
    jest.spyOn(networkSelectors, 'selectIsAllNetworks').mockReturnValue(false);
  });

  it('passes each contract row its NFTs, matching addresses case-insensitively', () => {
    const { contracts, nfts } = buildData(3, 4);
    const notOwned = {
      address: contracts[0].address,
      name: 'Sold',
      tokenId: '99',
      isCurrentlyOwned: false,
    };
    const emptyContract = { address: contractAddress(50), name: 'Empty' };
    mockSelectors([...contracts, emptyContract], [...nfts, notOwned]);

    renderWithProvider(<CollectibleContracts />, { state: mockState });

    const byName = Object.fromEntries(
      rowRenders().map((p) => [p.asset.name, p]),
    );
    contracts.forEach((contract, i) => {
      const names = (
        byName[contract.name].contractCollectibles as { name: string }[]
      ).map((c) => c.name);
      expect(names).toEqual([0, 1, 2, 3].map((j) => `NFT ${i}-${j}`));
    });
    expect(byName.Empty.contractCollectibles).toEqual([]);
    expect(byName['Contract 0'].collectiblesVisible).toBe(true);
    expect(byName['Contract 1'].collectiblesVisible).toBe(false);
  });

  it('resolves favorites by exact address and token id', () => {
    const { contracts, nfts } = buildData(2, 3);
    const favorites = [
      { address: contracts[1].address, tokenId: '0' },
      { address: contracts[0].address.toLowerCase(), tokenId: '1' },
      { address: contracts[0].address, tokenId: 2 },
    ];
    mockSelectors(contracts, nfts, favorites);

    renderWithProvider(<CollectibleContracts />, { state: mockState });

    const favoritesRow = mockElementRenders.find((p) => p.asset.favorites);
    expect(
      (
        favoritesRow?.contractCollectibles as ({ name: string } | undefined)[]
      ).map((c) => c?.name),
    ).toEqual(['NFT 1-0', 'NFT 0-1', 'NFT 0-2']);
  });

  it('groups NFTs once instead of scanning all NFTs for every contract row', () => {
    const contractCount = 10;
    const nftsPerContract = 10;
    const { contracts, nfts, getAddressReads } = buildData(
      contractCount,
      nftsPerContract,
    );
    mockSelectors(contracts, nfts);

    renderWithProvider(<CollectibleContracts />, { state: mockState });

    expect(rowRenders()).toHaveLength(contractCount);
    // A per-row filter reads every NFT address once per row (10 x 100).
    expect(getAddressReads()).toBeLessThanOrEqual(nfts.length * 3);
  });

  it('keys rows by contract address and keeps renderItem stable across unrelated re-renders', () => {
    const { contracts, nfts } = buildData(3, 2);
    mockSelectors(contracts, nfts);

    const { UNSAFE_getByType, store } = renderWithProvider(
      <CollectibleContracts />,
      { state: mockState },
    );
    const list = UNSAFE_getByType(FlatList);
    const { renderItem, keyExtractor } = list.props;
    expect(contracts.map((c, i) => keyExtractor(c, i))).toEqual(
      contracts.map((c) => c.address),
    );
    expect(keyExtractor({ ...contracts[0], chainId: '0x89' }, 0)).toBe(
      `0x89-${contracts[0].address}`,
    );

    const rowRendersBefore = rowRenders().length;
    act(() => {
      store.dispatch({ type: SHOW_NFT_FETCHING_LOADER });
    });

    expect(UNSAFE_getByType(FlatList).props.renderItem).toBe(renderItem);
    expect(rowRenders().length).toBe(rowRendersBefore);
  });
});
