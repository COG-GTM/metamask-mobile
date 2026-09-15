declare module '@metamask/eth-json-rpc-filters' {
  import type { JsonRpcMiddleware } from '@metamask/json-rpc-engine';
  import type { Json, JsonRpcParams } from '@metamask/utils';
  import type { BlockTracker, Provider } from '@metamask/network-controller';

  interface FilterMiddlewareOptions {
    provider: Provider;
    blockTracker: BlockTracker;
  }

  export default function createFilterMiddleware(
    options: FilterMiddlewareOptions,
  ): JsonRpcMiddleware<JsonRpcParams, Json> & { destroy: () => void };
}
