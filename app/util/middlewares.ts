import type {
  JsonRpcMiddleware,
  JsonRpcEngineNextCallback,
} from '@metamask/json-rpc-engine';
import type {
  Json,
  JsonRpcParams,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import Logger from './Logger';
import trackErrorAsAnalytics from './metrics/TrackError/trackErrorAsAnalytics';

/**
 * List of rpc errors caused by the user rejecting a certain action.
 * Errors that include these phrases should not be logged to Sentry.
 * Examples of these errors include:
 * - User rejected the transaction
 * - User cancelled the transaction
 * - User rejected the request.
 * - MetaMask Message Signature: User denied message signature.
 * - MetaMask Personal Message Signature: User denied message signature.
 */
const USER_REJECTED_ERRORS = ['user rejected', 'user denied', 'user cancelled'];

const USER_REJECTED_ERROR_CODE = 4001;

interface MiddlewareOptions {
  origin: string;
}

interface OriginJsonRpcRequest extends JsonRpcRequest<JsonRpcParams> {
  origin?: string;
  isMetamaskInternal?: boolean;
}

type RpcResponseError = NonNullable<PendingJsonRpcResponse<Json>['error']>;

interface RpcErrorLogParams {
  message: string;
  orginalError: RpcResponseError;
  res: Omit<PendingJsonRpcResponse<Json>, 'error'>;
  req: OriginJsonRpcRequest;
  data?: unknown;
}

/**
 * Returns a middleware that appends the DApp origin to request
 * @param opts - The middleware options
 * @returns The origin middleware
 */
export function createOriginMiddleware(
  opts: MiddlewareOptions,
): JsonRpcMiddleware<JsonRpcParams, Json> {
  return function originMiddleware(
    req: OriginJsonRpcRequest,
    _: PendingJsonRpcResponse<Json>,
    next: JsonRpcEngineNextCallback,
  ) {
    req.origin = opts.origin;

    // web3-provider-engine compatibility
    // TODO:provider delete this after web3-provider-engine deprecation
    if (!req.params) {
      req.params = [];
    }

    next();
  };
}

/**
 * Checks if the error code or message contains a user rejected error
 * @param errorMessage - The error message
 * @param errorCode - The error code
 */
export function containsUserRejectedError(
  errorMessage: unknown,
  errorCode?: unknown,
): boolean {
  try {
    if (!errorMessage || !(typeof errorMessage === 'string')) return false;

    const userRejectedErrorMessage = USER_REJECTED_ERRORS.some(
      (userRejectedError) =>
        errorMessage.toLowerCase().includes(userRejectedError.toLowerCase()),
    );

    if (userRejectedErrorMessage) return true;

    if (errorCode === USER_REJECTED_ERROR_CODE) return true;

    return false;
  } catch (e) {
    return false;
  }
}

function toError(error: RpcResponseError): Error {
  if (error instanceof Error) {
    return error;
  }
  const rpcError = Object.assign(new Error(error.message), error);
  rpcError.name = 'JsonRpcError';
  return rpcError;
}

/**
 * Returns a middleware that logs RPC activity
 * @param opts - The middleware options
 * @returns The logger middleware
 */
export function createLoggerMiddleware(
  opts: MiddlewareOptions,
): JsonRpcMiddleware<JsonRpcParams, Json> {
  return function loggerMiddleware(
    req: OriginJsonRpcRequest,
    res: PendingJsonRpcResponse<Json>,
    next: JsonRpcEngineNextCallback,
  ) {
    next((cb) => {
      if (res.error) {
        const { error, ...resWithoutError } = res;
        if (error) {
          if (containsUserRejectedError(error.message, error.code)) {
            trackErrorAsAnalytics(
              `Error in RPC response: User rejected`,
              error.message,
            );
          } else {
            // Example of a rpc error:
            // { "code":-32603,
            //   "message":"Internal JSON-RPC error.",
            //   "data":{"code":-32000,"message":"gas required exceeds allowance (59956966) or always failing transaction"}
            // }
            // This will make the error log to sentry with the title "gas required exceeds allowance (59956966) or always failing transaction"
            // making it easier to differentiate each error.
            const errorParams: RpcErrorLogParams = {
              message: 'Error in RPC response',
              orginalError: error,
              res: resWithoutError,
              req,
            };

            if (error.data) {
              errorParams.data = error.data;
            }

            Logger.error(toError(error), errorParams);
          }
        }
      }
      if (req.isMetamaskInternal) {
        return;
      }
      Logger.log(`RPC (${opts.origin}):`, req, '->', res);
      cb();
    });
  };
}
