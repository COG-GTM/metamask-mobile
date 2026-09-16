import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import AssetSearch from './';
import { backgroundState } from '../../../util/test/initial-root-state';
import Engine from '../../../core/Engine';
import { ImportTokenViewSelectorsIDs } from '../../../../e2e/selectors/wallet/ImportTokenView.selectors';
import { act, fireEvent } from '@testing-library/react-native';

const mockSnxAddress = '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f';
const mockSnxToken = {
  address: mockSnxAddress,
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
};

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
          data: {
            [mockSnxAddress]: mockSnxToken,
          },
        },
      },
      preventPollingOnNetworkRestart: false,
    },
  },
}));

const initialState = {
  engine: {
    backgroundState: {
      ...backgroundState,
      TokenListController: {
        ...backgroundState.TokenListController,
        tokensChainsCache: {
          '0x1': {
            data: {
              [mockSnxAddress]: mockSnxToken,
            },
          },
        },
      },
    },
  },
};

describe('AssetSearch', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

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

  it('debounces search on text change', () => {
    jest.useFakeTimers();
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
    onSearch.mockClear();

    const searchBar = getByTestId(ImportTokenViewSelectorsIDs.SEARCH_BAR);
    fireEvent.changeText(searchBar, 'S');
    fireEvent.changeText(searchBar, 'SN');
    fireEvent.changeText(searchBar, 'SNX');

    expect(onSearch).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        searchQuery: 'SNX',
        results: expect.arrayContaining([
          expect.objectContaining({ address: mockSnxAddress }),
        ]),
      }),
    );
  });

  it('returns exact address match', () => {
    jest.useFakeTimers();
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
    onSearch.mockClear();

    const searchBar = getByTestId(ImportTokenViewSelectorsIDs.SEARCH_BAR);
    fireEvent.changeText(
      searchBar,
      `0x${mockSnxAddress.slice(2).toUpperCase()}`,
    );

    act(() => {
      jest.advanceTimersByTime(250);
    });

    const [{ results }] = onSearch.mock.calls[0];
    expect(results[0].address).toBe(mockSnxAddress);
  });

  it('runs pending search after token list update', () => {
    jest.useFakeTimers();
    const onSearch = jest.fn();
    const { getByTestId, rerender } = renderWithProvider(
      <AssetSearch
        onSearch={onSearch}
        onFocus={jest.fn}
        onBlur={jest.fn}
        allNetworksEnabled
      />,
      { state: initialState },
    );
    onSearch.mockClear();

    fireEvent.changeText(
      getByTestId(ImportTokenViewSelectorsIDs.SEARCH_BAR),
      'SNX',
    );

    const updatedOnSearch = jest.fn();
    rerender(
      <AssetSearch
        onSearch={updatedOnSearch}
        onFocus={jest.fn}
        onBlur={jest.fn}
        allNetworksEnabled
      />,
    );

    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(updatedOnSearch).toHaveBeenCalledTimes(1);
    expect(updatedOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({ searchQuery: 'SNX' }),
    );
  });

  it('clear button cancels pending search and resets immediately', () => {
    jest.useFakeTimers();
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
    onSearch.mockClear();

    fireEvent.changeText(
      getByTestId(ImportTokenViewSelectorsIDs.SEARCH_BAR),
      'SNX',
    );
    fireEvent.press(getByTestId(ImportTokenViewSelectorsIDs.CLEAR_SEARCH_BAR));

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ searchQuery: '' }),
    );

    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(onSearch).toHaveBeenCalledTimes(1);
  });
});
