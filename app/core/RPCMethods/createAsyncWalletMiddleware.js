import { createWalletMiddleware } from '@metamask/eth-json-rpc-middleware';




import { getAccounts, processSendCalls, getCallsStatus } from './eip5792';

export const createAsyncWalletMiddleware = () =>



createWalletMiddleware({
  getAccounts,
  processSendCalls,
  getCallsStatus
});