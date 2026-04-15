





import {


  WalletDevice } from
'@metamask/transaction-controller';
import { rpcErrors } from '@metamask/rpc-errors';
import ppomUtil from '../../lib/ppom/ppom-util';

/**
 * A JavaScript object that is not `null`, a function, or an array.
 *
 * TODO: replace this with `RuntimeObject` from `@metamask/utils`
 */


/**
 * A type guard for {@link RuntimeObject}.
 *
 * TODO: replace this with `isObject` from `@metamask/utils`
 *
 * @param value - The value to check.
 * @returns Whether the specified value has a runtime type of `object` and is
 * neither `null` nor an `Array`.
 */
function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * A type guard for ensuring an object has a property.
 *
 * TODO: replace this with `hasProperty` from `@metamask/utils`
 *
 * @param objectToCheck - The object to check.
 * @param name - The property name to check for.
 * @returns Whether the specified object has an own property with the specified
 * name, regardless of whether it is enumerable or not.
 */
const hasProperty = (




objectToCheck,
name) =>

Object.hasOwnProperty.call(objectToCheck, name);






/**
 * Handle a `eth_sendTransaction` request.
 *
 * @param args - Named arguments.
 * @param args.hostname - The hostname associated with this request.
 * @param args.req - The JSON-RPC request.
 * @param args.res - The JSON-RPC response.
 * @param args.sendTransaction - A function that requests approval for the given transaction, then
 * signs the transaction and broadcasts it.
 * @param args.validateAccountAndChainId - A function that validates the account and chain ID
 * used in the transaction.
 */
async function eth_sendTransaction({
  hostname,
  req,
  res,
  sendTransaction,
  validateAccountAndChainId









}) {
  if (
  !Array.isArray(req.params) &&
  !(isObject(req.params) && hasProperty(req.params, 0)))
  {
    throw rpcErrors.invalidParams({
      message: `Invalid parameters: expected an array`
    });
  }
  const transactionParameters = req.params[0];
  if (!isObject(transactionParameters)) {
    throw rpcErrors.invalidParams({
      message: `Invalid parameters: expected the first parameter to be an object`
    });
  }
  // TODO: Normalize chainId to Hex string
  const nChainId = typeof req.params[0].chainId === 'number' ?
  req.params[0].chainId :
  parseInt(req.params[0].chainId || '0x0', 16);
  await validateAccountAndChainId({
    from: req.params[0].from,
    chainId: nChainId
  });

  const { result, transactionMeta } = await sendTransaction(req.params[0], {
    deviceConfirmedOn: WalletDevice.MM_MOBILE,
    networkClientId: req.networkClientId,
    origin: hostname
  });

  ppomUtil.validateRequest(req, transactionMeta?.id);

  res.result = await result;
}

export default eth_sendTransaction;