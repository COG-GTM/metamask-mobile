import {
  getPermissionsHandler,
  requestPermissionsHandler,
  revokePermissionsHandler,
} from '@metamask/eip1193-permission-middleware';
import {
  CaveatSpecificationConstraint,
  PermissionController,
  PermissionSpecificationConstraint,
  PermittedHandlerExport,
} from '@metamask/permission-controller';
import { Json, JsonRpcParams } from '@metamask/utils';
import { makeMethodMiddlewareMaker } from '../utils';
import { eip1193OnlyHandlers } from '../handlers';
import { RequestEthereumAccountsHooks } from '../eth-request-accounts';

/**
 * The hooks into the background required by every handler of the injected
 * 1193 provider API.
 */
export interface Eip1193Hooks extends RequestEthereumAccountsHooks {
  getPermissionsForOrigin: () => ReturnType<
    PermissionController<
      PermissionSpecificationConstraint,
      CaveatSpecificationConstraint
    >['getPermissions']
  >;
  revokePermissionsForOrigin: (permissionKeys: string[]) => void;
}

// The handlers of the EIP-2255 permission middleware constrain their request
// and hook types more tightly than the generic handler contract of
// `makeMethodMiddlewareMaker`, so the list is widened to the shared contract.
const handlers = [
  ...eip1193OnlyHandlers,
  // EIP-2255 Permission handlers
  getPermissionsHandler,
  requestPermissionsHandler,
  revokePermissionsHandler,
] as unknown as PermittedHandlerExport<Eip1193Hooks, JsonRpcParams, Json>[];

// The primary home of RPC method implementations for the injected 1193 provider API. MUST be subsequent
// to our permission logic in the EIP-1193 JSON-RPC middleware pipeline.
export const createEip1193MethodMiddleware =
  makeMethodMiddlewareMaker(handlers);
