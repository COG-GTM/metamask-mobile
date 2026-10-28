import React from 'react';
import { Text } from 'react-native';
import { waitFor } from '@testing-library/react-native';
import renderWithProvider from '../../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../../util/test/initial-root-state';
import { getSafeChainsList } from '../../../../../util/networks/safeChainsList';
import withIsOriginalNativeToken from './withIsOriginalNativeToken';

jest.mock('../../../../../util/networks/safeChainsList', () => ({
  getSafeChainsList: jest.fn(),
}));
const mockGetSafeChainsList = getSafeChainsList as jest.MockedFunction<
  typeof getSafeChainsList
>;

const SAFE_CHAINS = [
  {
    chainId: 1,
    name: 'Ethereum Mainnet',
    nativeCurrency: { symbol: 'ETH' },
    rpc: [],
  },
];

const receivedProps = jest.fn();
const Probe = (props: { matchedChainNetwork: unknown }) => {
  receivedProps(props.matchedChainNetwork);
  return <Text>probe</Text>;
};
const Wrapped = withIsOriginalNativeToken(Probe);

const stateWithSafeChainsValidation = (
  useSafeChainsListValidation: boolean,
) => ({
  engine: {
    backgroundState: {
      ...backgroundState,
      PreferencesController: {
        ...backgroundState.PreferencesController,
        useSafeChainsListValidation,
      },
    },
  },
});

describe('withIsOriginalNativeToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes the shared safe chains list without copying it', async () => {
    mockGetSafeChainsList.mockResolvedValue(SAFE_CHAINS);

    renderWithProvider(<Wrapped />, {
      state: stateWithSafeChainsValidation(true),
    });

    await waitFor(() =>
      expect(receivedProps).toHaveBeenLastCalledWith({
        safeChainsList: SAFE_CHAINS,
      }),
    );
    expect(receivedProps.mock.lastCall?.[0].safeChainsList).toBe(SAFE_CHAINS);
    expect(mockGetSafeChainsList).toHaveBeenCalledTimes(1);
  });

  it('skips the download when safe chains validation is turned off', async () => {
    renderWithProvider(<Wrapped />, {
      state: stateWithSafeChainsValidation(false),
    });

    await waitFor(() => expect(receivedProps).toHaveBeenCalled());
    expect(mockGetSafeChainsList).not.toHaveBeenCalled();
    expect(receivedProps).toHaveBeenLastCalledWith(null);
  });
});
