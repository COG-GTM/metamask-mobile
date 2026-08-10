import {
  getPermissionsHandler,
  requestPermissionsHandler,
  revokePermissionsHandler,
} from '@metamask/eip1193-permission-middleware';
import { PermittedHandlerExport } from '@metamask/permission-controller';
import { Json, JsonRpcParams } from '@metamask/utils';
import { makeMethodMiddlewareMaker } from '../utils';
import { eip1193OnlyHandlers } from '../handlers';

/**
 * Each handler declares its own, narrower hooks type, while the middleware
 * maker requires a single hooks type for all of them. The handlers are
 * therefore widened to a permissive hooks record.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Eip1193Hooks = Record<string, any>;

// The primary home of RPC method implementations for the injected 1193 provider API. MUST be subsequent
// to our permission logic in the EIP-1193 JSON-RPC middleware pipeline.
export const createEip1193MethodMiddleware = makeMethodMiddlewareMaker([
  ...eip1193OnlyHandlers,
  // EIP-2255 Permission handlers
  getPermissionsHandler,
  requestPermissionsHandler,
  revokePermissionsHandler,
] as unknown as PermittedHandlerExport<Eip1193Hooks, JsonRpcParams, Json>[]);
