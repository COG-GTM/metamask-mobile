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
 * Each handler declares its own set of hooks, so the handlers are widened to a
 * common handler type. `makeMethodMiddlewareMaker` selects and validates the
 * hooks of each handler at runtime.
 */
export type Eip1193MethodHandler = PermittedHandlerExport<
  Record<string, unknown>,
  JsonRpcParams,
  Json
>;

// The primary home of RPC method implementations for the injected 1193 provider API. MUST be subsequent
// to our permission logic in the EIP-1193 JSON-RPC middleware pipeline.
export const createEip1193MethodMiddleware = makeMethodMiddlewareMaker([
  ...eip1193OnlyHandlers,
  // EIP-2255 Permission handlers
  getPermissionsHandler,
  requestPermissionsHandler,
  revokePermissionsHandler,
] as unknown as Eip1193MethodHandler[]);
