import {
  getPermissionsHandler,
  requestPermissionsHandler,
  revokePermissionsHandler,
} from '@metamask/eip1193-permission-middleware';
import { PermittedHandlerExport } from '@metamask/permission-controller';
import { Json, JsonRpcParams } from '@metamask/utils';
import { makeMethodMiddlewareMaker } from '../utils';
import { eip1193OnlyHandlers } from '../handlers';

type UnionToIntersection<U> = (
  U extends unknown ? (arg: U) => void : never
) extends (arg: infer I) => void
  ? I
  : never;

type Eip1193Handler =
  | (typeof eip1193OnlyHandlers)[number]
  | typeof getPermissionsHandler
  | typeof requestPermissionsHandler
  | typeof revokePermissionsHandler;

type Eip1193MethodHooks = UnionToIntersection<
  Parameters<Eip1193Handler['implementation']>[4]
>;

// The primary home of RPC method implementations for the injected 1193 provider API. MUST be subsequent
// to our permission logic in the EIP-1193 JSON-RPC middleware pipeline.
export const createEip1193MethodMiddleware =
  makeMethodMiddlewareMaker<Eip1193MethodHooks>([
    ...eip1193OnlyHandlers,
    // EIP-2255 Permission handlers
    getPermissionsHandler,
    requestPermissionsHandler,
    revokePermissionsHandler,
  ] as unknown as PermittedHandlerExport<
    Eip1193MethodHooks,
    JsonRpcParams,
    Json
  >[]);
