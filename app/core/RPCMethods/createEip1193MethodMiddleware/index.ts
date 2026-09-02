import {
  getPermissionsHandler,
  requestPermissionsHandler,
  revokePermissionsHandler,
} from '@metamask/eip1193-permission-middleware';
import type { PermittedHandlerExport } from '@metamask/permission-controller';
import type { Json, JsonRpcParams } from '@metamask/utils';
import { makeMethodMiddlewareMaker } from '../utils';
import { Eip1193OnlyHooks, eip1193OnlyHandlers } from '../handlers';

type GetPermissionsHooks = Parameters<
  typeof getPermissionsHandler.implementation
>[4];
type RequestPermissionsHooks = Parameters<
  typeof requestPermissionsHandler.implementation
>[4];
type RevokePermissionsHooks = Parameters<
  typeof revokePermissionsHandler.implementation
>[4];

type Eip1193MethodHooks = Eip1193OnlyHooks &
  GetPermissionsHooks &
  RequestPermissionsHooks &
  RevokePermissionsHooks;

// The primary home of RPC method implementations for the injected 1193 provider API. MUST be subsequent
// to our permission logic in the EIP-1193 JSON-RPC middleware pipeline.
export const createEip1193MethodMiddleware =
  makeMethodMiddlewareMaker<Eip1193MethodHooks>([
    ...(eip1193OnlyHandlers as unknown as PermittedHandlerExport<
      Eip1193MethodHooks,
      JsonRpcParams,
      Json
    >[]),
    // EIP-2255 Permission handlers
    getPermissionsHandler as unknown as PermittedHandlerExport<
      Eip1193MethodHooks,
      JsonRpcParams,
      Json
    >,
    requestPermissionsHandler as unknown as PermittedHandlerExport<
      Eip1193MethodHooks,
      JsonRpcParams,
      Json
    >,
    revokePermissionsHandler as unknown as PermittedHandlerExport<
      Eip1193MethodHooks,
      JsonRpcParams,
      Json
    >,
  ]);
