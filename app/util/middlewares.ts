import type { JsonRpcMiddleware } from '@metamask/json-rpc-engine';
import type { Json, JsonRpcParams } from '@metamask/utils';
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

interface OriginMiddlewareOptions {
  origin: string;
}

interface OriginRequest extends Record<string, unknown> {
  origin?: string;
  params?: unknown[];
  isMetamaskInternal?: boolean;
}

interface RpcError {
  message?: string;
  code?: number;
  data?: Json;
}

interface RpcResponse extends Record<string, unknown> {
  error?: RpcError;
}

/**
 * Returns a middleware that appends the DApp origin to request
 * @param opts - The middleware options
 * @returns Middleware function
 */
export function createOriginMiddleware(
  opts: OriginMiddlewareOptions,
): JsonRpcMiddleware<JsonRpcParams, Json> {
  return function originMiddleware(
    req: OriginRequest,
    _res: unknown,
    next: () => void,
  ) {
    req.origin = opts.origin;

    // web3-provider-engine compatibility
    // TODO:provider delete this after web3-provider-engine deprecation
    if (!req.params) {
      req.params = [];
    }

    next();
  } as JsonRpcMiddleware<JsonRpcParams, Json>;
}

/**
 * Checks if the error code or message contains a user rejected error
 * @param errorMessage - The error message to check
 * @param errorCode - The error code to check
 * @returns Whether the error is a user rejected error
 */
export function containsUserRejectedError(
  errorMessage: string | undefined,
  errorCode: number | undefined,
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

interface LoggerErrorParams {
  message: string;
  orginalError: RpcError;
  res: Omit<RpcResponse, 'error'>;
  req: OriginRequest;
  data?: Json;
}

/**
 * Returns a middleware that logs RPC activity
 * @param opts - The middleware options
 * @returns Middleware function
 */
export function createLoggerMiddleware(
  opts: OriginMiddlewareOptions,
): JsonRpcMiddleware<JsonRpcParams, Json> {
  return function loggerMiddleware(
    req: OriginRequest,
    res: RpcResponse,
    next: (callback?: (cb: () => void) => void) => void,
  ) {
    next((cb: () => void) => {
      if (res.error) {
        const { error, ...resWithoutError } = res;
        if (error) {
          if (containsUserRejectedError(error.message, error.code)) {
            trackErrorAsAnalytics(
              `Error in RPC response: User rejected`,
              error.message ?? '',
            );
          } else {
            // Example of a rpc error:
            // { "code":-32603,
            //   "message":"Internal JSON-RPC error.",
            //   "data":{"code":-32000,"message":"gas required exceeds allowance (59956966) or always failing transaction"}
            // }
            // This will make the error log to sentry with the title "gas required exceeds allowance (59956966) or always failing transaction"
            // making it easier to differentiate each error.
            const errorParams: LoggerErrorParams = {
              message: 'Error in RPC response',
              orginalError: error,
              res: resWithoutError,
              req,
            };

            if (error.data) {
              errorParams.data = error.data;
            }

            Logger.error(error as unknown as Error, errorParams);
          }
        }
      }
      if (req.isMetamaskInternal) {
        return;
      }
      Logger.log(`RPC (${opts.origin}):`, req, '->', res);
      cb();
    });
  } as JsonRpcMiddleware<JsonRpcParams, Json>;
}
