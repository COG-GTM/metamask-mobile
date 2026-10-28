import React from 'react';
import { render } from '@testing-library/react-native';

import { AssetPollingProvider } from './AssetPollingProvider';

function mockPollingHook() {
  return {
    __esModule: true,
    default: jest.fn(),
    useCurrencyRatePollingOnly: jest.fn(),
    useTokenRatesPollingOnly: jest.fn(),
    useTokenListPollingOnly: jest.fn(),
    useTokenBalancesPollingOnly: jest.fn(),
    useAccountTrackerPollingOnly: jest.fn(),
  };
}

jest.mock('./useCurrencyRatePolling', () => mockPollingHook());
jest.mock('./useTokenRatesPolling', () => mockPollingHook());
jest.mock('./useTokenDetectionPolling', () => jest.fn());
jest.mock('./useTokenListPolling', () => mockPollingHook());
jest.mock('./useTokenBalancesPolling', () => mockPollingHook());
jest.mock('./useAccountTrackerPolling', () => mockPollingHook());

describe('AssetPollingProvider', () => {
  it('should call all polling hooks', () => {
    render(<AssetPollingProvider />);

    expect(
      jest.requireMock('./useCurrencyRatePolling').useCurrencyRatePollingOnly,
    ).toHaveBeenCalled();
    expect(
      jest.requireMock('./useTokenRatesPolling').useTokenRatesPollingOnly,
    ).toHaveBeenCalled();
    expect(jest.requireMock('./useTokenDetectionPolling')).toHaveBeenCalled();
    expect(
      jest.requireMock('./useTokenListPolling').useTokenListPollingOnly,
    ).toHaveBeenCalled();
    expect(
      jest.requireMock('./useTokenBalancesPolling').useTokenBalancesPollingOnly,
    ).toHaveBeenCalled();
    expect(
      jest.requireMock('./useAccountTrackerPolling')
        .useAccountTrackerPollingOnly,
    ).toHaveBeenCalled();
  });

  it('should not use the data-returning hook variants', () => {
    render(<AssetPollingProvider />);

    for (const hook of [
      './useCurrencyRatePolling',
      './useTokenRatesPolling',
      './useTokenListPolling',
      './useTokenBalancesPolling',
      './useAccountTrackerPolling',
    ]) {
      expect(jest.requireMock(hook).default).not.toHaveBeenCalled();
    }
  });
});
