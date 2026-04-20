import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import axios from 'axios';
import withIsOriginalNativeToken from './withIsOriginalNativeToken';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

interface WrappedProps {
  matchedChainNetwork?: { safeChainsList: unknown[] } | null;
  extra?: string;
}

const Wrapped = ({ matchedChainNetwork, extra }: WrappedProps) => (
  <Text testID="wrapped">
    {`${extra ?? ''}|${matchedChainNetwork ? 'loaded' : 'null'}`}
  </Text>
);

describe('withIsOriginalNativeToken', () => {
  beforeEach(() => {
    mockedAxios.get.mockReset();
  });

  it('renders the wrapped component with matchedChainNetwork=null initially and forwards props', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });
    const Wrapper = withIsOriginalNativeToken(Wrapped);

    const { getByTestId } = render(<Wrapper extra="hello" />);
    expect(getByTestId('wrapped').props.children).toBe('hello|null');

    await waitFor(() => {
      expect(getByTestId('wrapped').props.children).toBe('hello|loaded');
    });
  });

  it('passes safe chains list to the wrapped component once resolved', async () => {
    const safeChainsList = [{ chainId: 1, name: 'Ethereum' }];
    mockedAxios.get.mockResolvedValueOnce({ data: safeChainsList });

    const captured: Array<{ safeChainsList: unknown[] } | null | undefined> =
      [];
    const Capture = ({ matchedChainNetwork }: WrappedProps) => {
      captured.push(matchedChainNetwork);
      return <Text>cap</Text>;
    };

    const Wrapper = withIsOriginalNativeToken(Capture);
    render(<Wrapper />);

    await waitFor(() => {
      expect(
        captured.some(
          (v) => v?.safeChainsList && v.safeChainsList.length === 1,
        ),
      ).toBe(true);
    });
  });
});
