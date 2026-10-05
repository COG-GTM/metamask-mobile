import { AccountsControllerGetSelectedAccountAction } from '@metamask/accounts-controller';
import {
  GetCallsStatusCode,
  GetCallsStatusResult,
  SendCalls,
  SendCallsResult,
} from '@metamask/eth-json-rpc-middleware';
import { Hex, JsonRpcRequest } from '@metamask/utils';
import { JsonRpcError, providerErrors, rpcErrors } from '@metamask/rpc-errors';
import { v4 as uuidv4 } from 'uuid';
import {
  Log,
  TransactionControllerGetStateAction,
  TransactionMeta,
  TransactionReceipt,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { Messenger } from '@metamask/base-controller';
import { NetworkControllerGetNetworkClientByIdAction } from '@metamask/network-controller';

import ppomUtil from '../../lib/ppom/ppom-util';
import Engine from '../Engine';
import { getPermittedAccounts } from '../Permissions';

const VERSION = '2.0.0';

enum EIP5792ErrorCode {
  UnsupportedNonOptionalCapability = 5700,
  UnsupportedChainId = 5710,
  UnknownBundleId = 5730,
  RejectedUpgrade = 5750,
}

type JSONRPCRequest = JsonRpcRequest & {
  networkClientId: string;
  origin?: string;
};

export const getAccounts = async (origin: string): Promise<string[]> =>
  getPermittedAccounts(origin);

function validateSendCallsVersion(sendCalls: SendCalls) {
  const { version } = sendCalls;

  if (version !== VERSION) {
    throw rpcErrors.invalidInput(
      `Version not supported: Got ${version}, expected ${VERSION}`,
    );
  }
}

async function validateSendCallsChainId(
  sendCalls: SendCalls,
  req: JSONRPCRequest,
  from: Hex,
) {
  const { TransactionController } = Engine.context;
  const { chainId } = sendCalls;
  const { networkClientId } = req;

  const dappChainId = Engine.controllerMessenger.call(
    'NetworkController:getNetworkClientById',
    networkClientId,
  ).configuration.chainId;

  if (chainId && chainId.toLowerCase() !== dappChainId.toLowerCase()) {
    throw rpcErrors.invalidParams(
      `Chain ID must match the dApp selected network: Got ${chainId}, expected ${dappChainId}`,
    );
  }

  const batchSupport = await TransactionController.isAtomicBatchSupported({
    address: from,
    chainIds: [dappChainId],
  });

  const chainBatchSupport = batchSupport?.[0];

  if (!chainBatchSupport) {
    throw new JsonRpcError(
      EIP5792ErrorCode.UnsupportedChainId,
      `EIP-7702 not supported on chain: ${dappChainId}`,
    );
  }
}

function validateCapabilities(sendCalls: SendCalls) {
  const { calls, capabilities } = sendCalls;

  const requiredTopLevelCapabilities = Object.keys(capabilities ?? {}).filter(
    (name) => capabilities?.[name].optional !== true,
  );

  const requiredCallCapabilities = calls.flatMap((call) =>
    Object.keys(call.capabilities ?? {}).filter(
      (name) => call.capabilities?.[name].optional !== true,
    ),
  );

  const requiredCapabilities = [
    ...requiredTopLevelCapabilities,
    ...requiredCallCapabilities,
  ];

  if (requiredCapabilities?.length) {
    throw new JsonRpcError(
      EIP5792ErrorCode.UnsupportedNonOptionalCapability,
      `Unsupported non-optional capabilities: ${requiredCapabilities.join(
        ', ',
      )}`,
    );
  }
}

async function validateSendCalls(
  sendCalls: SendCalls,
  req: JSONRPCRequest,
  from: Hex,
) {
  validateSendCallsVersion(sendCalls);
  await validateSendCallsChainId(sendCalls, req, from);
  validateCapabilities(sendCalls);
}

export async function processSendCalls(
  params: SendCalls,
  req: JsonRpcRequest,
  origin: string,
): Promise<SendCallsResult> {
  const { TransactionController } = Engine.context;
  const { calls, from: paramFrom } = params;
  const { networkClientId, origin: requestOrigin } = req as JsonRpcRequest & {
    networkClientId: string;
    origin?: string;
  };
  const transactions = calls.map((call) => ({ params: call }));

  const permittedAccounts = await getAccounts(origin);
  const from = (paramFrom ?? permittedAccounts[0]) as Hex | undefined;

  if (
    !from ||
    !permittedAccounts.some(
      (account) => account.toLowerCase() === from.toLowerCase(),
    )
  ) {
    throw providerErrors.unauthorized();
  }

  await validateSendCalls(params, req as JSONRPCRequest, from);
  const securityAlertId = uuidv4();

  const { batchId: id } = await TransactionController.addTransactionBatch({
    from,
    networkClientId,
    origin: requestOrigin,
    securityAlertId,
    transactions,
    validateSecurity:
      ppomUtil.createValidatorForSecurityAlertId(securityAlertId),
  });

  return { id };
}

function getStatusCode(transactionMeta: TransactionMeta) {
  const { hash, status } = transactionMeta;

  if (status === TransactionStatus.confirmed) {
    return GetCallsStatusCode.CONFIRMED;
  }

  if (status === TransactionStatus.failed) {
    return hash
      ? GetCallsStatusCode.REVERTED
      : GetCallsStatusCode.FAILED_OFFCHAIN;
  }

  if (status === TransactionStatus.dropped) {
    return GetCallsStatusCode.REVERTED;
  }

  return GetCallsStatusCode.PENDING;
}

type Actions =
  | AccountsControllerGetSelectedAccountAction
  | NetworkControllerGetNetworkClientByIdAction
  | TransactionControllerGetStateAction;

export type EIP5792Messenger = Messenger<Actions, never>;

export async function getCallsStatus(id: Hex): Promise<GetCallsStatusResult> {
  const transactions = Engine.controllerMessenger
    .call('TransactionController:getState')
    .transactions.filter((tx: TransactionMeta) => tx.batchId === id);

  if (!transactions?.length) {
    throw new JsonRpcError(
      EIP5792ErrorCode.UnknownBundleId,
      `No matching bundle found`,
    );
  }

  const transaction = transactions[0];
  const { chainId, txReceipt: rawTxReceipt } = transaction;
  const status = getStatusCode(transaction);
  const txReceipt = rawTxReceipt as Required<TransactionReceipt> | undefined;
  const logs = (txReceipt?.logs ?? []) as Required<Log>[];

  const receipts: GetCallsStatusResult['receipts'] = txReceipt && [
    {
      blockHash: txReceipt.blockHash as Hex,
      blockNumber: txReceipt.blockNumber as Hex,
      gasUsed: txReceipt.gasUsed as Hex,
      logs: logs.map((log: Required<Log> & { data: Hex }) => ({
        address: log.address as Hex,
        data: log.data,
        topics: log.topics as unknown as Hex[],
      })),
      status: txReceipt.status as '0x0' | '0x1',
      transactionHash: txReceipt.transactionHash,
    },
  ];

  return {
    version: VERSION,
    id,
    chainId,
    atomic: true,
    status,
    receipts,
  };
}
