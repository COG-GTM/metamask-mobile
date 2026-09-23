import React from 'react';
import { Text } from 'react-native';
import { waitFor } from '@testing-library/react-native';
import renderWithProvider from '../../../../../util/test/renderWithProvider';
import { getSafeChainsList } from '../../../../../util/networks/safeChainsList';
import withIsOriginalNativeToken, {
  WithIsOriginalNativeTokenProps,
} from './withIsOriginalNativeToken';

jest.mock('../../../../../util/networks/safeChainsList', () => ({
  getSafeChainsList: jest.fn(),
}));

const mockGetSafeChainsList = getSafeChainsList as jest.Mock;

const safeChainsList = [
  {
    chainId: 1,
    name: 'Ethereum Mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpc: ['https://mainnet.infura.io/v3/'],
  },
];

const Wrapped = ({ matchedChainNetwork }: WithIsOriginalNativeTokenProps) => (
  <Text testID="matched">
    {matchedChainNetwork
      ? String(matchedChainNetwork.safeChainsList.length)
      : 'none'}
  </Text>
);

const Component = withIsOriginalNativeToken(Wrapped);

const stateWithValidation = (useSafeChainsListValidation: boolean) => ({
  engine: {
    backgroundState: {
      PreferencesController: { useSafeChainsListValidation },
    },
  },
});

describe('withIsOriginalNativeToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSafeChainsList.mockResolvedValue(safeChainsList);
  });

  it('passes the fetched chain list down when validation is enabled', async () => {
    const { getByTestId } = renderWithProvider(<Component />, {
      state: stateWithValidation(true),
    });

    await waitFor(() =>
      expect(getByTestId('matched').props.children).toBe('1'),
    );
    expect(mockGetSafeChainsList).toHaveBeenCalledTimes(1);
  });

  it('skips the fetch when the safe chains validation toggle is off', async () => {
    const { getByTestId } = renderWithProvider(<Component />, {
      state: stateWithValidation(false),
    });

    await waitFor(() =>
      expect(getByTestId('matched').props.children).toBe('none'),
    );
    expect(mockGetSafeChainsList).not.toHaveBeenCalled();
  });

  it('ignores a resolved fetch after unmount', async () => {
    let resolveList: (value: unknown[]) => void = () => undefined;
    mockGetSafeChainsList.mockReturnValue(
      new Promise((resolve) => {
        resolveList = resolve;
      }),
    );

    const { unmount } = renderWithProvider(<Component />, {
      state: stateWithValidation(true),
    });

    unmount();
    resolveList(safeChainsList);

    await waitFor(() => expect(mockGetSafeChainsList).toHaveBeenCalledTimes(1));
  });
});
