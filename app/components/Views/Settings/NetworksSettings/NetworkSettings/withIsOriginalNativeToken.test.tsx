import React from 'react';
import { Text } from 'react-native';
import axios from 'axios';
import { render, waitFor } from '@testing-library/react-native';
import withIsOriginalNativeToken from './withIsOriginalNativeToken';
import { resetSafeChainsListCache, SafeChain } from './safeChainsList';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const SAFE_CHAINS_LIST: SafeChain[] = [
  { chainId: 1, nativeCurrency: { symbol: 'ETH' } },
];

const Wrapped = withIsOriginalNativeToken(
  ({
    matchedChainNetwork,
  }: {
    matchedChainNetwork: { safeChainsList: SafeChain[] } | null;
  }) => (
    <Text testID="chains">
      {matchedChainNetwork ? matchedChainNetwork.safeChainsList.length : 'none'}
    </Text>
  ),
);

describe('withIsOriginalNativeToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSafeChainsListCache();
    mockedAxios.get.mockResolvedValue({ data: SAFE_CHAINS_LIST });
  });

  it('passes the fetched chains list to the wrapped component', async () => {
    const { getByTestId } = render(<Wrapped />);

    await waitFor(() => expect(getByTestId('chains').props.children).toBe(1));
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://chainid.network/chains.json',
      expect.objectContaining({ timeout: expect.any(Number) }),
    );
  });

  it('fetches the chains list only once across mounts', async () => {
    const first = render(<Wrapped />);
    await waitFor(() =>
      expect(first.getByTestId('chains').props.children).toBe(1),
    );
    first.unmount();

    const second = render(<Wrapped />);
    await waitFor(() =>
      expect(second.getByTestId('chains').props.children).toBe(1),
    );

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('retries after a failed request', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('network error'));

    const first = render(<Wrapped />);
    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(1));
    expect(first.getByTestId('chains').props.children).toBe('none');
    first.unmount();

    const second = render(<Wrapped />);
    await waitFor(() =>
      expect(second.getByTestId('chains').props.children).toBe(1),
    );
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });
});
