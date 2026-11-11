import ParsedURL from 'url-parse';
// eslint-disable-next-line import/no-nodejs-modules
import { Buffer } from 'buffer';
import { JsonRpcParams } from '@metamask/utils';

export const JSON_RPC_REQUEST_TIMEOUT_MS = 10000;

/**
 * Makes a JSON RPC request to the given URL, with the given RPC method and params.
 *
 * @param {string} rpcUrl - The RPC endpoint URL to target.
 * @param {string} rpcMethod - The RPC method to request.
 * @param {Array<unknown>} [rpcParams] - The RPC method params.
 * @returns {Promise<unknown|undefined>} Returns the result of the RPC method call,
 * or throws an error in case of failure.
 */
export async function jsonRpcRequest(
  rpcUrl: string,
  rpcMethod: string,
  rpcParams: JsonRpcParams = [],
) {
  let fetchUrl = rpcUrl;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Convert basic auth URL component to Authorization header
  const parsedUrl = new ParsedURL(rpcUrl);
  const { origin, pathname, username, password, query } = parsedUrl;
  // URLs containing username and password needs special processing
  if (username && password) {
    const encodedAuth = Buffer.from(`${username}:${password}`).toString(
      'base64',
    );
    headers.Authorization = `Basic ${encodedAuth}`;
    fetchUrl = `${origin}${pathname}${query}`;
  }

  const abortController = new AbortController();
  const timeoutId = setTimeout(
    () => abortController.abort(),
    JSON_RPC_REQUEST_TIMEOUT_MS,
  );

  let jsonRpcResponseJson;
  try {
    const jsonRpcResponse = await fetch(fetchUrl, {
      method: 'POST',
      body: JSON.stringify({
        id: Date.now().toString(),
        jsonrpc: '2.0',
        method: rpcMethod,
        params: rpcParams,
      }),
      headers,
      cache: 'default',
      // Never attach the in-app browser's cookies (shared cookie store on Android).
      credentials: 'omit',
      signal: abortController.signal,
    });
    jsonRpcResponseJson = await jsonRpcResponse.json();
  } finally {
    clearTimeout(timeoutId);
  }

  if (
    !jsonRpcResponseJson ||
    Array.isArray(jsonRpcResponseJson) ||
    typeof jsonRpcResponseJson !== 'object'
  ) {
    throw new Error(`RPC endpoint ${rpcUrl} returned non-object response.`);
  }
  const { error, result } = jsonRpcResponseJson;

  if (error) {
    throw new Error(error?.message || error);
  }
  return result;
}

export default jsonRpcRequest;
