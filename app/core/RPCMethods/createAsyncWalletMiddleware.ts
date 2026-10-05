import { createWalletMiddleware } from '@metamask/eth-json-rpc-middleware';
import { JsonRpcMiddleware } from '@metamask/json-rpc-engine';
import { JsonRpcParams } from '@metamask/eth-query';
import { Json } from '@metamask/utils';

import { getAccounts, processSendCalls, getCallsStatus } from './eip5792';

export const createAsyncWalletMiddleware = (
  origin: string,
): JsonRpcMiddleware<JsonRpcParams, Json> =>
  createWalletMiddleware({
    getAccounts: () => getAccounts(origin),
    processSendCalls: (params, req) => processSendCalls(params, req, origin),
    getCallsStatus,
  }) as JsonRpcMiddleware<JsonRpcParams, Json>;
