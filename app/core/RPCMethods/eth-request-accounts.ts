import { rpcErrors } from '@metamask/rpc-errors';
import {
  JsonRpcParams,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import { MESSAGE_TYPE } from '../createTracingMiddleware';
import { trackDappViewedEvent } from '../../util/metrics';

interface RequestEthereumAccountsHooks {
  getAccounts: (options?: { ignoreLock?: boolean }) => string[];
  getUnlockPromise: (shouldShowUnlockRequest: boolean) => Promise<void>;
  getCaip25PermissionFromLegacyPermissionsForOrigin: () => unknown;
  requestPermissionsForOrigin: (permissions: unknown) => Promise<unknown>;
}

interface RequestEthereumAccountsHandler {
  methodNames: string[];
  implementation: typeof requestEthereumAccountsHandler;
  hookNames: {
    getAccounts: true;
    getUnlockPromise: true;
    getCaip25PermissionFromLegacyPermissionsForOrigin: true;
    requestPermissionsForOrigin: true;
  };
}

const requestEthereumAccounts: RequestEthereumAccountsHandler = {
  methodNames: [MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS],
  implementation: requestEthereumAccountsHandler,
  hookNames: {
    getAccounts: true,
    getUnlockPromise: true,
    getCaip25PermissionFromLegacyPermissionsForOrigin: true,
    requestPermissionsForOrigin: true,
  },
};
export default requestEthereumAccounts;

// Used to rate-limit pending requests to one per origin
const locks = new Set<string>();

/**
 * This method attempts to retrieve the Ethereum accounts available to the
 * requester, or initiate a request for account access if none are currently
 * available. It is essentially a wrapper of wallet_requestPermissions that
 * only errors if the user rejects the request. We maintain the method for
 * backwards compatibility reasons.
 *
 * @param req - The JsonRpcEngine request
 * @param res - The JsonRpcEngine result object
 * @param _next - JsonRpcEngine next() callback - unused
 * @param end - JsonRpcEngine end() callback
 * @param options - Method hooks passed to the method implementation
 * @returns A promise that resolves to nothing
 */
async function requestEthereumAccountsHandler(
  req: JsonRpcRequest<JsonRpcParams> & { origin: string },
  res: PendingJsonRpcResponse<string[]>,
  _next: () => void,
  end: (err?: unknown) => void,
  {
    getAccounts,
    getUnlockPromise,
    getCaip25PermissionFromLegacyPermissionsForOrigin,
    requestPermissionsForOrigin,
  }: RequestEthereumAccountsHooks,
): Promise<void> {
  const { origin } = req;
  if (locks.has(origin)) {
    res.error = rpcErrors.resourceUnavailable(
      `Already processing ${MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS}. Please wait.`,
    );
    return end();
  }

  let ethAccounts = getAccounts({ ignoreLock: true });
  if (ethAccounts.length > 0) {
    // We wait for the extension to unlock in this case only, because permission
    // requests are handled when the extension is unlocked, regardless of the
    // lock state when they were received.
    try {
      locks.add(origin);
      await getUnlockPromise(true);
      res.result = ethAccounts;
      end();
    } catch (error) {
      end(error);
    } finally {
      locks.delete(origin);
    }
    return undefined;
  }

  try {
    const caip25Permission =
      getCaip25PermissionFromLegacyPermissionsForOrigin();
    await requestPermissionsForOrigin(caip25Permission);
  } catch (error) {
    return end(error);
  }

  // We cannot derive ethAccounts directly from the CAIP-25 permission
  // because the accounts will not be in order of lastSelected
  ethAccounts = getAccounts({ ignoreLock: true });

  trackDappViewedEvent({
    hostname: origin,
    numberOfConnectedAccounts: ethAccounts.length,
  });

  res.result = ethAccounts;
  return end();
}
