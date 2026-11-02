import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import AssetSearch, { SEARCH_DEBOUNCE_MS } from './';
import { backgroundState } from '../../../util/test/initial-root-state';
import Engine from '../../../core/Engine';
import { ImportTokenViewSelectorsIDs } from '../../../../e2e/selectors/wallet/ImportTokenView.selectors';
import { act, fireEvent } from '@testing-library/react-native';
const mockedEngine = Engine;

jest.mock('../../../core/Engine', () => ({
  init: () => mockedEngine.init({}),
  context: {
    KeyringController: {
      getQRKeyringState: async () => ({ subscribe: () => ({}) }),
    },
    TokenListController: {
      tokensChainsCache: {
        '0x1': {
          data: [
            {
              '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f': {
                address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
                symbol: 'SNX',
                decimals: 18,
                name: 'Synthetix Network Token',
                iconUrl:
                  'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f.png',
                type: 'erc20',
                aggregators: [
                  'Aave',
                  'Bancor',
                  'CMC',
                  'Crypto.com',
                  'CoinGecko',
                  '1inch',
                  'PMM',
                  'Synthetix',
                  'Zerion',
                  'Lifi',
                ],
                occurrences: 10,
                fees: {
                  '0x5fd79d46eba7f351fe49bff9e87cdea6c821ef9f': 0,
                  '0xda4ef8520b1a57d7d63f1e249606d1a459698876': 0,
                },
              },
            },
          ],
        },
      },
      preventPollingOnNetworkRestart: false,
    },
  },
}));

const initialState = {
  engine: {
    backgroundState,
  },
};

describe('AssetSearch', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <AssetSearch
        onSearch={jest.fn}
        onFocus={jest.fn}
        onBlur={jest.fn}
        allNetworksEnabled
      />,
      { state: initialState },
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('should call onSearch', () => {
    const onSearch = jest.fn();
    const { getByTestId } = renderWithProvider(
      <AssetSearch
        onSearch={onSearch}
        onFocus={jest.fn}
        onBlur={jest.fn}
        allNetworksEnabled
      />,
      { state: initialState },
    );
    const clearSearchBar = getByTestId(
      ImportTokenViewSelectorsIDs.CLEAR_SEARCH_BAR,
    );
    fireEvent.press(clearSearchBar);

    expect(onSearch).toHaveBeenCalled();
  });

  describe('search', () => {
    const SNX_ADDRESS = '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f';
    const LINK_ADDRESS = '0x514910771af9ca656af840dff83e8264ecf986ca';
    const tokensChainsCache = {
      '0x1': {
        timestamp: 0,
        data: {
          [SNX_ADDRESS]: {
            address: SNX_ADDRESS,
            symbol: 'SNX',
            decimals: 18,
            name: 'Synthetix Network Token',
            aggregators: [],
            occurrences: 10,
          },
        },
      },
      '0x89': {
        timestamp: 0,
        data: {
          [LINK_ADDRESS]: {
            address: LINK_ADDRESS,
            symbol: 'LINK',
            decimals: 18,
            name: 'Chainlink',
            aggregators: [],
            occurrences: 10,
          },
        },
      },
    };
    const searchState = {
      engine: {
        backgroundState: {
          ...backgroundState,
          TokenListController: {
            ...backgroundState.TokenListController,
            tokensChainsCache,
          },
        },
      },
    };

    const renderSearch = () => {
      const onSearch = jest.fn();
      const utils = renderWithProvider(
        <AssetSearch
          onSearch={onSearch}
          onFocus={jest.fn}
          onBlur={jest.fn}
          allNetworksEnabled
        />,
        { state: searchState },
      );
      onSearch.mockClear();
      const type = (text: string) =>
        fireEvent.changeText(
          utils.getByTestId(ImportTokenViewSelectorsIDs.SEARCH_BAR),
          text,
        );
      return { ...utils, onSearch, type };
    };

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('updates the input immediately but runs one search per typing burst', () => {
      const { onSearch, type, getByTestId } = renderSearch();

      type('s');
      type('sy');
      type('syn');

      expect(
        getByTestId(ImportTokenViewSelectorsIDs.SEARCH_BAR).props.value,
      ).toBe('syn');
      expect(onSearch).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
      });

      expect(onSearch).toHaveBeenCalledTimes(1);
      const { searchQuery, results } = onSearch.mock.calls[0][0];
      expect(searchQuery).toBe('syn');
      expect(results[0]).toMatchObject({ symbol: 'SNX', chainId: '0x1' });
    });

    it('looks up address-shaped input across all enabled chains', () => {
      const { onSearch, type } = renderSearch();

      type(LINK_ADDRESS.toUpperCase().replace('0X', '0x'));
      act(() => {
        jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
      });

      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch.mock.calls[0][0].results).toEqual([
        expect.objectContaining({ address: LINK_ADDRESS, chainId: '0x89' }),
      ]);
    });

    it('returns no results for an unknown address', () => {
      const { onSearch, type } = renderSearch();

      type(`0x${'1'.repeat(40)}`);
      act(() => {
        jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
      });

      expect(onSearch.mock.calls[0][0].results).toEqual([]);
    });

    it('clears results immediately and drops a pending search on empty input', () => {
      const { onSearch, type } = renderSearch();

      type('chain');
      type('');

      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch).toHaveBeenLastCalledWith({
        searchQuery: '',
        results: [],
      });

      act(() => {
        jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
      });

      expect(onSearch).toHaveBeenCalledTimes(1);
    });
  });
});
