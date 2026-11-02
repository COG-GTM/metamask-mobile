import React from 'react';
import { AssetLoader } from '.';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { Hex } from '@metamask/utils';
import { screen } from '@testing-library/react-native';
import Engine from '../../../core/Engine';

const mockDispatch = jest.fn();
jest.mock('@react-navigation/native', () => {
    const actual = jest.requireActual('@react-navigation/native');
    return {
        ...actual,
        useNavigation: jest.fn().mockImplementation(() => ({
            dispatch: mockDispatch,
        })),
    };
});

jest.mock('../../../core/Engine', () => ({
  context: {
    TokenSearchDiscoveryDataController: {
      fetchTokenDisplayData: jest.fn(),
    },
  },
}));

const mockSelectTokenDisplayData = jest.fn();
jest.mock('../../../selectors/tokenSearchDiscoveryDataController', () => ({
    selectTokenDisplayData: () => mockSelectTokenDisplayData(),
}));

const mockState = {
    engine: {
        backgroundState: {
            TokenSearchDiscoveryDataController: {
                tokenDisplayData: [],
            },
        },
    },
};

const assetData = {
    address: '0x123',
    chainId: '0x1' as Hex,
};

describe('AssetLoader', () => {
  const mockFetchTokenDisplayData = Engine.context.TokenSearchDiscoveryDataController
    .fetchTokenDisplayData as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show activity indicator while loading token', () => {
    mockSelectTokenDisplayData.mockReturnValue(undefined);
    renderWithProvider(<AssetLoader route={{ params: assetData }} />, { state: mockState });
    expect(screen.getByTestId('asset-loader-spinner')).toBeDefined();
  });

  it('should show a message saying the token was not found if the token is not found', () => {
    mockSelectTokenDisplayData.mockReturnValue({
        found: false,
    });
    renderWithProvider(<AssetLoader route={{ params: assetData }} />, { state: mockState });
    expect(screen.getByText('Token not found')).toBeDefined();
  });

  it('should navigate to the asset view if the token is found', () => {
    mockSelectTokenDisplayData.mockReturnValue({
        found: true,
        token: {}
    });
    renderWithProvider(<AssetLoader route={{ params: assetData }} />, { state: mockState });
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('fetches token display data once when the fetch result lands in state', () => {
    mockSelectTokenDisplayData.mockReturnValue(undefined);
    const { rerender } = renderWithProvider(<AssetLoader route={{ params: assetData }} />, { state: mockState });
    expect(mockFetchTokenDisplayData).toHaveBeenCalledTimes(1);
    expect(mockFetchTokenDisplayData).toHaveBeenCalledWith(assetData.chainId, assetData.address);

    mockSelectTokenDisplayData.mockReturnValue({ found: true, token: { symbol: 'ABC' } });
    rerender(<AssetLoader route={{ params: assetData }} />);

    expect(mockFetchTokenDisplayData).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it('does not fetch when token display data is already cached', () => {
    mockSelectTokenDisplayData.mockReturnValue({ found: true, token: {} });
    renderWithProvider(<AssetLoader route={{ params: assetData }} />, { state: mockState });
    expect(mockFetchTokenDisplayData).not.toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it('does not fetch when a cached not-found result exists', () => {
    mockSelectTokenDisplayData.mockReturnValue({ found: false });
    renderWithProvider(<AssetLoader route={{ params: assetData }} />, { state: mockState });
    expect(mockFetchTokenDisplayData).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('fetches again when the requested token changes', () => {
    mockSelectTokenDisplayData.mockReturnValue(undefined);
    const { rerender } = renderWithProvider(<AssetLoader route={{ params: assetData }} />, { state: mockState });
    rerender(<AssetLoader route={{ params: { ...assetData, address: '0x456' } }} />);
    expect(mockFetchTokenDisplayData).toHaveBeenCalledTimes(2);
    expect(mockFetchTokenDisplayData).toHaveBeenLastCalledWith(assetData.chainId, '0x456');
  });
});
