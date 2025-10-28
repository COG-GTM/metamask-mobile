///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
/* eslint-disable import/no-commonjs */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line import/no-nodejs-modules
import { Duplex } from 'stream';
import {
  createSwappableProxy,
  createEventEmitterProxy,
} from '@metamask/swappable-obj-proxy';
import { JsonRpcEngine } from '@metamask/json-rpc-engine';
import { createEngineStream } from '@metamask/json-rpc-middleware-stream';
import EthQuery from '@metamask/eth-query';

import Engine from '../Engine';
import { setupMultiplex } from '../../util/streams';
import Logger from '../../util/Logger';
import snapMethodMiddlewareBuilder from './SnapsMethodMiddleware';
import { SubjectType } from '@metamask/permission-controller';

import ObjectMultiplex from '@metamask/object-multiplex';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - No type definitions available
import createFilterMiddleware from '@metamask/eth-json-rpc-filters';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - No type definitions available
import createSubscriptionManager from '@metamask/eth-json-rpc-filters/subscriptionManager';
import { providerAsMiddleware } from '@metamask/eth-json-rpc-middleware';
const pump = require('pump');

interface Provider {
  sendAsync: (
    request: { method: string; params?: unknown[] },
    callback: (error: Error | null, response?: unknown) => void,
  ) => void;
  [key: string]: unknown;
}

interface BlockTracker {
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
  [key: string]: unknown;
}

interface RPCMethodMiddlewareArgs {
  hostname: string;
  getProviderState: () => Promise<{
    isUnlocked: boolean;
    chainId: string;
    networkVersion: string | null;
  }>;
}

interface ISnapBridgeProps {
  snapId: string;
  connectionStream: Duplex;
  getRPCMethodMiddleware: (args: RPCMethodMiddlewareArgs) => unknown;
}

export default class SnapBridge {
  snapId: string;
  stream: Duplex;
  getRPCMethodMiddleware: (args: RPCMethodMiddlewareArgs) => unknown;
  provider!: Provider;
  blockTracker!: BlockTracker;
  deprecatedNetworkVersions: Record<string, string | null>;

  #mux: ObjectMultiplex;
  #providerProxy: Provider | null;
  #blockTrackerProxy: BlockTracker | null;

  constructor({
    snapId,
    connectionStream,
    getRPCMethodMiddleware,
  }: ISnapBridgeProps) {
    Logger.log(
      '[SNAP BRIDGE LOG] Engine+setupSnapProvider: Setup bridge for Snap',
      snapId,
    );

    this.snapId = snapId;
    this.stream = connectionStream;
    this.getRPCMethodMiddleware = getRPCMethodMiddleware;
    this.deprecatedNetworkVersions = {};

    const { NetworkController } = Engine.context as unknown as {
      NetworkController: {
        getProviderAndBlockTracker: () => {
          provider: Provider;
          blockTracker: BlockTracker;
        };
      };
    };

    const { provider, blockTracker } =
      NetworkController.getProviderAndBlockTracker();

    this.#providerProxy = null;
    this.#blockTrackerProxy = null;

    this.#setProvider(provider);
    this.#setBlockTracker(blockTracker);

    this.#mux = setupMultiplex(this.stream);
  }

  #setProvider = (provider: Provider): void => {
    if (this.#providerProxy) {
      (this.#providerProxy as unknown as { setTarget: (target: Provider) => void }).setTarget(provider);
    } else {
      this.#providerProxy = createSwappableProxy(provider) as unknown as Provider;
    }
    this.provider = provider;
  };

  #setBlockTracker = (blockTracker: BlockTracker): void => {
    if (this.#blockTrackerProxy) {
      (this.#blockTrackerProxy as unknown as { setTarget: (target: BlockTracker) => void }).setTarget(blockTracker);
    } else {
      this.#blockTrackerProxy = createEventEmitterProxy(blockTracker as unknown as Parameters<typeof createEventEmitterProxy>[0], {
        eventFilter: 'skipInternal',
      }) as unknown as BlockTracker;
    }
    this.blockTracker = blockTracker;
  };

  async getProviderState() {
    return {
      isUnlocked: this.isUnlocked(),
      ...(await this.getProviderNetworkState(this.snapId)),
    };
  }

  setupProviderConnection = () => {
    Logger.log('[SNAP BRIDGE LOG] Engine+setupProviderConnection');
    const outStream = (this.#mux as unknown as { createStream: (name: string) => Duplex }).createStream('metamask-provider');
    const engine = this.setupProviderEngine();

    const providerStream = createEngineStream({ engine });
    pump(outStream, providerStream, outStream, (err: Error | null) => {
      engine.destroy();
      if (err) Logger.log('Error with provider stream conn', err);
    });
  };

  setupProviderEngine = () => {
    const engine = new JsonRpcEngine();

    // create filter polyfill middleware
    const filterMiddleware = createFilterMiddleware({
      provider: this.#providerProxy,
      blockTracker: this.#blockTrackerProxy,
    });

    // create subscription polyfill middleware
    const subscriptionManager = createSubscriptionManager({
      provider: this.#providerProxy,
      blockTracker: this.#blockTrackerProxy,
    });

    subscriptionManager.events.on('notification', (message: unknown) =>
      engine.emit('notification', message),
    );

    // Filter and subscription polyfills
    engine.push(filterMiddleware);
    engine.push(subscriptionManager.middleware);

    const { context, controllerMessenger } = Engine;
    const { PermissionController } = context;

    engine.push(
      PermissionController.createPermissionMiddleware({
        origin: this.snapId,
      }),
    );

    engine.push(
      snapMethodMiddlewareBuilder(
        context,
        controllerMessenger,
        this.snapId,
        SubjectType.Snap,
      ),
    );

    // User-Facing RPC methods
    engine.push(
      this.getRPCMethodMiddleware({
        hostname: this.snapId,
        getProviderState: this.getProviderState.bind(this),
      }) as Parameters<typeof engine.push>[0],
    );

    // Forward to metamask primary provider
    engine.push(providerAsMiddleware(this.#providerProxy as unknown as Parameters<typeof providerAsMiddleware>[0]));
    return engine;
  };

  isUnlocked = (): boolean => {
    const { KeyringController } = Engine.context as unknown as {
      KeyringController: {
        isUnlocked: () => boolean;
      };
    };
    return KeyringController.isUnlocked();
  };

  async getProviderNetworkState(origin: string) {
    const networkClientId = Engine.controllerMessenger.call(
      'SelectedNetworkController:getNetworkClientIdForDomain',
      origin,
    );

    const networkClient = Engine.controllerMessenger.call(
      'NetworkController:getNetworkClientById',
      networkClientId,
    );

    const { chainId } = networkClient.configuration;

    let networkVersion = this.deprecatedNetworkVersions[networkClientId];
    if (!networkVersion) {
      const ethQuery = new EthQuery(networkClient.provider);
      networkVersion = await new Promise((resolve) => {
        ethQuery.sendAsync({ method: 'net_version' }, (error, result) => {
          if (error) {
            console.error(error);
            resolve(null);
          } else {
            resolve(result as string | null);
          }
        });
      });
      this.deprecatedNetworkVersions[networkClientId] = networkVersion;
    }

    return {
      chainId,
      networkVersion: networkVersion ?? 'loading',
    };
  }
}
///: END:ONLY_INCLUDE_IF
