import { RPC_METHODS } from '../SDKConnectConstants';
import DevLogger from '../utils/DevLogger';

export interface OverwritableRpc {
  method: string;
  params: unknown[];
  [key: string]: unknown;
}

interface TypedDataParam {
  domain: { chainId: string };
}

export const overwriteRPCWith = ({
  rpc,
  accountAddress,
  selectedChainId,
}: {
  rpc: OverwritableRpc;
  accountAddress: string;
  selectedChainId: string;
}) => {
  DevLogger.log(`overwriteRPCWith:: method=${rpc?.method}`, rpc);
  // Handle
  if (rpc.method.toLowerCase() === RPC_METHODS.PERSONAL_SIGN.toLowerCase()) {
    // Replace address value with the selected address
    rpc.params = [rpc.params[0], accountAddress];
  } else if (
    rpc.method.toLowerCase() === RPC_METHODS.ETH_SENDTRANSACTION.toLowerCase()
  ) {
    const originalParams = rpc.params[0] as Record<string, unknown>;
    const { from, ...rest } = originalParams;
    rpc.params = [{ ...rest, from: accountAddress }];
  } else if (
    rpc.method.toLowerCase() === RPC_METHODS.ETH_SIGNTYPEDEATA.toLowerCase()
  ) {
    const originalParams = rpc.params[1] as TypedDataParam;
    // overwrite domain.chainId
    originalParams.domain.chainId = selectedChainId;
    rpc.params = [accountAddress, originalParams];
  } else if (
    [
      RPC_METHODS.ETH_SIGNTYPEDEATAV4.toLowerCase(),
      RPC_METHODS.ETH_SIGNTYPEDEATAV3.toLowerCase(),
    ].includes(rpc.method.toLowerCase())
  ) {
    const originalParams = rpc.params[1] as TypedDataParam;
    // overwrite domain.chainId
    originalParams.domain.chainId = selectedChainId;
    rpc.params = [accountAddress, JSON.stringify(originalParams)];
  } else {
    DevLogger.log(`overwriteRPCWith:: method=${rpc.method} not handled`);
  }

  return rpc;
};

export default overwriteRPCWith;
