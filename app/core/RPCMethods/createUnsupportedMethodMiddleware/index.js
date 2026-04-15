import { rpcErrors } from '@metamask/rpc-errors';


import { UNSUPPORTED_RPC_METHODS } from '../utils';


/**
 * Creates a middleware that rejects explicitly unsupported RPC methods with the
 * appropriate error.
 */
const createUnsupportedMethodMiddleware = () =>



async function unsupportedMethodMiddleware(req, _res, next, end) {
  if (UNSUPPORTED_RPC_METHODS.has(req.method)) {
    return end(rpcErrors.methodNotSupported());
  }
  return next();
};

export default createUnsupportedMethodMiddleware;