import React from 'react';
import { Text } from 'react-native';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { render, waitFor } from '@testing-library/react-native';
import axios from 'axios';
import withIsOriginalNativeToken from './withIsOriginalNativeToken';
import { resetSafeChainsListCache } from '../../../../../util/networks/safeChainsList';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const chains = [{ chainId: 137, name: 'Polygon Mainnet' }];

interface WrappedProps {
  matchedChainNetwork: { safeChainsList: typeof chains } | null;
}

const Wrapped = ({ matchedChainNetwork }: WrappedProps) => (
  <Text testID="list">
    {matchedChainNetwork
      ? JSON.stringify(matchedChainNetwork.safeChainsList)
      : 'none'}
  </Text>
);
const Enhanced = withIsOriginalNativeToken(Wrapped);

const mockStore = configureMockStore();
const storeWith = (useSafeChainsListValidation: boolean) =>
  mockStore({
    engine: {
      backgroundState: {
        PreferencesController: { useSafeChainsListValidation },
      },
    },
  });

const renderEnhanced = (useSafeChainsListValidation: boolean) =>
  render(
    <Provider store={storeWith(useSafeChainsListValidation)}>
      <Enhanced />
    </Provider>,
  );

describe('withIsOriginalNativeToken', () => {
  beforeEach(() => {
    resetSafeChainsListCache();
    mockedAxios.get.mockReset();
    mockedAxios.get.mockResolvedValue({ data: chains });
  });

  it('does not download the chain list when safe chain validation is off', async () => {
    const { getByTestId } = renderEnhanced(false);

    await waitFor(() =>
      expect(getByTestId('list').props.children).toBe('none'),
    );
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('passes the chain list to the wrapped component when validation is on', async () => {
    const { getByTestId } = renderEnhanced(true);

    await waitFor(() =>
      expect(getByTestId('list').props.children).toBe(JSON.stringify(chains)),
    );
  });

  it('downloads the chain list once across repeated screen mounts', async () => {
    const first = renderEnhanced(true);
    await waitFor(() =>
      expect(first.getByTestId('list').props.children).toBe(
        JSON.stringify(chains),
      ),
    );
    first.unmount();

    const second = renderEnhanced(true);
    await waitFor(() =>
      expect(second.getByTestId('list').props.children).toBe(
        JSON.stringify(chains),
      ),
    );

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('keeps rendering when the download fails', async () => {
    mockedAxios.get.mockRejectedValue(new Error('network'));
    const { getByTestId } = renderEnhanced(true);

    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalled());
    expect(getByTestId('list').props.children).toBe('none');
  });
});
