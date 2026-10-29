import { DappClient } from '../dapp-sdk-types';

/**
 * True when `callerPackage` (attached natively from Binder.getCallingUid())
 * matches the package this approved connection is bound to.
 */
const isBoundCaller = (
  connection: Pick<DappClient, 'callerPackage'> | undefined,
  callerPackage: string | undefined,
): boolean =>
  !!connection?.callerPackage &&
  !!callerPackage &&
  connection.callerPackage === callerPackage;

export default isBoundCaller;
