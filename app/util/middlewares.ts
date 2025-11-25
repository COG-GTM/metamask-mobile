import Logger from './Logger';
import trackErrorAsAnalytics from './metrics/TrackError/trackErrorAsAnalytics';

interface MiddlewareOptions {
  origin: string;
}

interface RpcRequest {
  origin?: string;
  params?: unknown[];
  isMetamaskInternal?: boolean;
  [key: string]: unknown;
}

interface RpcError {
  code?: number;
  message?: string;
  data?: unknown;
}

interface RpcResponse {
  error?: RpcError;
  [key: string]: unknown;
}

interface ErrorParams {
  message: string;
  orginalError: RpcError;
  res: Omit<RpcResponse, 'error'>;
  req: RpcRequest;
  data?: unknown;
}

type NextCallback = (cb?: () => void) => void;

const USER_REJECTED_ERRORS = ['user rejected', 'user denied', 'user cancelled'];

const USER_REJECTED_ERROR_CODE = 4001;

export function createOriginMiddleware(
  opts: MiddlewareOptions,
): (req: RpcRequest, _: unknown, next: () => void) => void {
  return function originMiddleware(
    req: RpcRequest,
    _: unknown,
    next: () => void,
  ): void {
    req.origin = opts.origin;

    if (!req.params) {
      req.params = [];
    }

    next();
  };
}

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

export function createLoggerMiddleware(
  opts: MiddlewareOptions,
): (req: RpcRequest, res: RpcResponse, next: NextCallback) => void {
  return function loggerMiddleware(
    req: RpcRequest,
    res: RpcResponse,
    next: NextCallback,
  ): void {
    next((cb?: () => void) => {
      if (res.error) {
        const { error, ...resWithoutError } = res;
        if (error) {
          if (containsUserRejectedError(error.message, error.code)) {
            trackErrorAsAnalytics(
              `Error in RPC response: User rejected`,
              error.message,
            );
          } else {
            const errorParams: ErrorParams = {
              message: 'Error in RPC response',
              orginalError: error,
              res: resWithoutError,
              req,
            };

            if (error.data) {
              errorParams.data = error.data;
            }

            Logger.error(error, errorParams);
          }
        }
      }
      if (req.isMetamaskInternal) {
        return;
      }
      Logger.log(`RPC (${opts.origin}):`, req, '->', res);
      cb?.();
    });
  };
}
