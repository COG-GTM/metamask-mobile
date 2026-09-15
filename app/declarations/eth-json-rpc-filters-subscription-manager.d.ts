declare module '@metamask/eth-json-rpc-filters/subscriptionManager' {
  // eslint-disable-next-line import/no-nodejs-modules
  import type { EventEmitter } from 'events';
  import type { JsonRpcMiddleware } from '@metamask/json-rpc-engine';
  import type { Json, JsonRpcParams } from '@metamask/utils';
  import type { BlockTracker, Provider } from '@metamask/network-controller';

  interface SubscriptionManagerOptions {
    provider: Provider;
    blockTracker: BlockTracker;
  }

  interface SubscriptionManager {
    events: EventEmitter;
    middleware: JsonRpcMiddleware<JsonRpcParams, Json>;
    destroy: () => void;
  }

  export default function createSubscriptionManager(
    options: SubscriptionManagerOptions,
  ): SubscriptionManager;
}
