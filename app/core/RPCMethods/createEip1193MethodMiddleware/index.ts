import {
  getPermissionsHandler,
  requestPermissionsHandler,
  revokePermissionsHandler,
} from '@metamask/eip1193-permission-middleware';
import { makeMethodMiddlewareMaker } from '../utils';
import { eip1193OnlyHandlers } from '../handlers';

// The primary home of RPC method implementations for the injected 1193 provider API. MUST be subsequent
// to our permission logic in the EIP-1193 JSON-RPC middleware pipeline.
export const createEip1193MethodMiddleware = makeMethodMiddlewareMaker(
  [
    ...eip1193OnlyHandlers,
    // EIP-2255 Permission handlers
    getPermissionsHandler,
    requestPermissionsHandler,
    revokePermissionsHandler,
    // The handlers above each declare their own `Hooks` shape, so the array is
    // heterogeneous and cannot be expressed with a single type parameter.
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ] as any,
);
