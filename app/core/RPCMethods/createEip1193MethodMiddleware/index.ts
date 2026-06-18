import {
  getPermissionsHandler,
  requestPermissionsHandler,
  revokePermissionsHandler,
} from '@metamask/eip1193-permission-middleware';
import { PermittedHandlerExport } from '@metamask/permission-controller';
import type { Json, JsonRpcParams } from '@metamask/utils';
import { makeMethodMiddlewareMaker } from '../utils';
import { eip1193OnlyHandlers } from '../handlers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHandler = PermittedHandlerExport<any, JsonRpcParams, Json>;

// The primary home of RPC method implementations for the injected 1193 provider API. MUST be subsequent
// to our permission logic in the EIP-1193 JSON-RPC middleware pipeline.
export const createEip1193MethodMiddleware = makeMethodMiddlewareMaker([
  ...(eip1193OnlyHandlers as AnyHandler[]),
  // EIP-2255 Permission handlers
  getPermissionsHandler as unknown as AnyHandler,
  requestPermissionsHandler as unknown as AnyHandler,
  revokePermissionsHandler as unknown as AnyHandler,
]);
