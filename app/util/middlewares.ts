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

/**
 * JSON-RPC request interface
 */
interface RpcRequest {
  id: string | number | null;
  jsonrpc: '2.0';
  method: string;
  origin?: string;
  params?: unknown[];
  isMetamaskInternal?: boolean;
}

/**
 * RPC error interface
 */
interface RpcError {
  code?: number;
  message?: string;
  data?: unknown;
}

/**
 * RPC response interface
 */
interface RpcResponse {
  error?: RpcError;
  [key: string]: unknown;
}

/**
 * Middleware options interface
 */
interface MiddlewareOptions {
  origin: string;
}

/**
 * Middleware next function type
 */
type NextFunction = (callback?: (cb: () => void) => void) => void;

/**
 * Origin middleware function type
 */
type OriginMiddleware = (
  req: RpcRequest,
  res: RpcResponse,
  next: NextFunction,
) => void;

/**
 * Logger middleware function type
 */
type LoggerMiddleware = (
  req: RpcRequest,
  res: RpcResponse,
  next: NextFunction,
) => void;

/**
 * Returns a middleware that appends the DApp origin to request
 * @param opts - The middleware options
 * @returns The origin middleware function
 */
export function createOriginMiddleware(opts: MiddlewareOptions): OriginMiddleware {
  return function originMiddleware(
    req: RpcRequest,
    _res: RpcResponse,
    next: NextFunction,
  ): void {
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
 * @param errorMessage - The error message to check
 * @param errorCode - The error code to check
 * @returns True if the error is a user rejected error
 */
export function containsUserRejectedError(
  errorMessage: string | undefined | null,
  errorCode?: number,
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

/**
 * Error params interface for logging
 */
interface ErrorParams {
  message: string;
  orginalError: RpcError;
  res: Omit<RpcResponse, 'error'>;
  req: RpcRequest;
  data?: unknown;
}

/**
 * Returns a middleware that logs RPC activity
 * @param opts - The middleware options
 * @returns The logger middleware function
 */
export function createLoggerMiddleware(opts: MiddlewareOptions): LoggerMiddleware {
  return function loggerMiddleware(
    req: RpcRequest,
    res: RpcResponse,
    next: NextFunction,
  ): void {
    next((cb: () => void) => {
      if (res.error) {
        const { error, ...resWithoutError } = res;
        if (error) {
          if (containsUserRejectedError(error.message, error.code)) {
            trackErrorAsAnalytics(
              `Error in RPC response: User rejected`,
              error.message ?? 'Unknown error',
            );
          } else {
            /**
             * Example of a rpc error:
             * { "code":-32603,
             *   "message":"Internal JSON-RPC error.",
             *   "data":{"code":-32000,"message":"gas required exceeds allowance (59956966) or always failing transaction"}
             * }
             * This will make the error log to sentry with the title "gas required exceeds allowance (59956966) or always failing transaction"
             * making it easier to differentiate each error.
             */
            const errorParams: ErrorParams = {
              message: 'Error in RPC response',
              orginalError: error,
              res: resWithoutError,
              req,
            };

            if (error.data) {
              errorParams.data = error.data;
            }

            const errorObj = new Error(error.message ?? 'RPC Error');
            Logger.error(errorObj, errorParams);
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
