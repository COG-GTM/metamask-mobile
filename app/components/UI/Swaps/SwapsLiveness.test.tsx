import React from 'react';
import { AppState } from 'react-native';
import renderWithProvider from '../../../util/test/renderWithProvider';
import SwapsLiveness from './SwapsLiveness';

const mockFetchSwapsFeatureFlags = jest.fn();

jest.mock('@metamask/swaps-controller', () => {
  const actual = jest.requireActual('@metamask/swaps-controller');
  return {
    ...actual,
    swapsUtils: {
      ...actual.swapsUtils,
      fetchSwapsFeatureFlags: (...args: unknown[]) =>
        mockFetchSwapsFeatureFlags(...args),
    },
  };
});

jest.mock('./utils', () => ({
  isSwapsAllowed: jest.fn(() => true),
}));

jest.mock('../../hooks/useInterval', () => jest.fn());

const flush = async () => {
  await new Promise((resolve) => setImmediate(resolve));
};

describe('SwapsLiveness', () => {
  let appStateAddListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    mockFetchSwapsFeatureFlags.mockReset();
    appStateAddListenerSpy = jest
      .spyOn(AppState, 'addEventListener')
      .mockReturnValue({ remove: jest.fn() } as ReturnType<
        typeof AppState.addEventListener
      >);
  });

  afterEach(() => {
    appStateAddListenerSpy.mockRestore();
  });

  it('renders without crashing', () => {
    mockFetchSwapsFeatureFlags.mockResolvedValue({});
    const { toJSON } = renderWithProvider(<SwapsLiveness />);
    expect(toJSON()).toBeNull();
  });

  it('fetches swap feature flags on mount', async () => {
    mockFetchSwapsFeatureFlags.mockResolvedValue({ some: 'flag' });
    renderWithProvider(<SwapsLiveness />);
    await flush();
    expect(mockFetchSwapsFeatureFlags).toHaveBeenCalled();
  });

  it('registers an AppState change listener when swaps are allowed', () => {
    mockFetchSwapsFeatureFlags.mockResolvedValue({});
    renderWithProvider(<SwapsLiveness />);
    expect(appStateAddListenerSpy).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
  });

  it('handles errors from fetchSwapsFeatureFlags gracefully', async () => {
    mockFetchSwapsFeatureFlags.mockRejectedValue(new Error('boom'));
    const { toJSON } = renderWithProvider(<SwapsLiveness />);
    await flush();
    expect(toJSON()).toBeNull();
  });
});
