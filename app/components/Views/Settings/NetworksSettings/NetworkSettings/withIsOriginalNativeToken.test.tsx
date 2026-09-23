import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import axios from 'axios';
import Logger from '../../../../../util/Logger';
import withIsOriginalNativeToken from './withIsOriginalNativeToken';

jest.mock('axios');
jest.mock('../../../../../util/Logger');

const mockedAxios = axios as jest.Mocked<typeof axios>;

const Wrapped = withIsOriginalNativeToken(
  ({ matchedChainNetwork }: { matchedChainNetwork: unknown }) => (
    <Text testID="matched">{JSON.stringify(matchedChainNetwork)}</Text>
  ),
);

describe('withIsOriginalNativeToken', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('passes the fetched safe chains list to the wrapped component', async () => {
    mockedAxios.get.mockResolvedValue({ data: [{ chainId: 1 }] });

    const { getByTestId } = render(<Wrapped />);

    await waitFor(() =>
      expect(getByTestId('matched').props.children).toBe(
        JSON.stringify({ safeChainsList: [{ chainId: 1 }] }),
      ),
    );
    expect(Logger.error).not.toHaveBeenCalled();
  });

  it('logs the error when the chains list request fails', async () => {
    const error = new Error('network down');
    mockedAxios.get.mockRejectedValue(error);

    render(<Wrapped />);

    await waitFor(() =>
      expect(Logger.error).toHaveBeenCalledWith(
        error,
        'withIsOriginalNativeToken chains.json fetch failed',
      ),
    );
  });
});
