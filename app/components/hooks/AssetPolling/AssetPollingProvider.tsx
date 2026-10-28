import React from 'react';
import { useCurrencyRatePollingOnly } from './useCurrencyRatePolling';
import { useTokenRatesPollingOnly } from './useTokenRatesPolling';
import useTokenDetectionPolling from './useTokenDetectionPolling';
import { useTokenListPollingOnly } from './useTokenListPolling';
import { useTokenBalancesPollingOnly } from './useTokenBalancesPolling';
import { useAccountTrackerPollingOnly } from './useAccountTrackerPolling';

// This provider is a step towards making controller polling fully UI based.
// Eventually, individual UI components will call the use*Polling hooks to
// poll and return particular data. This polls globally in the meantime, using
// the polling-only variants so it does not subscribe to the polled state.
export const AssetPollingProvider = React.memo(() => {
  useCurrencyRatePollingOnly();
  useTokenRatesPollingOnly();
  useTokenDetectionPolling();
  useAccountTrackerPollingOnly();
  useTokenListPollingOnly();
  useTokenBalancesPollingOnly();

  return null;
});
