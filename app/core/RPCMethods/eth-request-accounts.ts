import { rpcErrors } from '@metamask/rpc-errors';
import { MESSAGE_TYPE } from '../createTracingMiddleware';
import { trackDappViewedEvent } from '../../util/metrics';

interface JsonRpcRequest {
  origin: string;
  method?: string;
  params?: unknown[];
}

interface JsonRpcResponse {
  result?: string[];
  error?: ReturnType<typeof rpcErrors.resourceUnavailable>;
}

type EndCallback = (error?: Error) => void;
type NextCallback = () => void;

interface RequestAccountsHooks {
  getAccounts: (options: { ignoreLock: boolean }) => string[];
  getUnlockPromise: (shouldShowUnlockRequest: boolean) => Promise<void>;
  getCaip25PermissionFromLegacyPermissionsForOrigin: () => unknown;
  requestPermissionsForOrigin: (permission: unknown) => Promise<void>;
}

const requestEthereumAccounts = {
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

const locks = new Set<string>();

async function requestEthereumAccountsHandler(
  req: JsonRpcRequest,
  res: JsonRpcResponse,
  _next: NextCallback,
  end: EndCallback,
  {
    getAccounts,
    getUnlockPromise,
    getCaip25PermissionFromLegacyPermissionsForOrigin,
    requestPermissionsForOrigin,
  }: RequestAccountsHooks,
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
    try {
      locks.add(origin);
      await getUnlockPromise(true);
      res.result = ethAccounts;
      end();
    } catch (error) {
      end(error as Error);
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
    return end(error as Error);
  }

  ethAccounts = getAccounts({ ignoreLock: true });

  trackDappViewedEvent(origin, ethAccounts.length);

  res.result = ethAccounts;
  return end();
}
