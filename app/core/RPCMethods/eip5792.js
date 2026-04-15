
import {
  GetCallsStatusCode } from



'@metamask/eth-json-rpc-middleware';

import { JsonRpcError, rpcErrors } from '@metamask/rpc-errors';
import { v4 as uuidv4 } from 'uuid';
import {




  TransactionStatus } from
'@metamask/transaction-controller';



import ppomUtil from '../../lib/ppom/ppom-util';
import Engine from '../Engine';

const VERSION = '2.0.0';var

EIP5792ErrorCode = /*#__PURE__*/function (EIP5792ErrorCode) {EIP5792ErrorCode[EIP5792ErrorCode["UnsupportedNonOptionalCapability"] = 5700] = "UnsupportedNonOptionalCapability";EIP5792ErrorCode[EIP5792ErrorCode["UnsupportedChainId"] = 5710] = "UnsupportedChainId";EIP5792ErrorCode[EIP5792ErrorCode["UnknownBundleId"] = 5730] = "UnknownBundleId";EIP5792ErrorCode[EIP5792ErrorCode["RejectedUpgrade"] = 5750] = "RejectedUpgrade";return EIP5792ErrorCode;}(EIP5792ErrorCode || {});











export const getAccounts = async () => {
  const { AccountsController } = Engine.context;
  const selectedAddress = AccountsController.getSelectedAccount()?.address;
  return Promise.resolve(selectedAddress ? [selectedAddress] : []);
};

function validateSendCallsVersion(sendCalls) {
  const { version } = sendCalls;

  if (version !== VERSION) {
    throw rpcErrors.invalidInput(
      `Version not supported: Got ${version}, expected ${VERSION}`
    );
  }
}

async function validateSendCallsChainId(
sendCalls,
req)
{
  const { TransactionController, AccountsController } = Engine.context;
  const { chainId } = sendCalls;
  const { networkClientId } = req;

  const dappChainId = Engine.controllerMessenger.call(
    'NetworkController:getNetworkClientById',
    networkClientId
  ).configuration.chainId;

  if (chainId && chainId.toLowerCase() !== dappChainId.toLowerCase()) {
    throw rpcErrors.invalidParams(
      `Chain ID must match the dApp selected network: Got ${chainId}, expected ${dappChainId}`
    );
  }

  const from =
  sendCalls.from ?? AccountsController.getSelectedAccount()?.address;

  const batchSupport = await TransactionController.isAtomicBatchSupported({
    address: from,
    chainIds: [dappChainId]
  });

  const chainBatchSupport = batchSupport?.[0];

  if (!chainBatchSupport) {
    throw new JsonRpcError(
      EIP5792ErrorCode.UnsupportedChainId,
      `EIP-7702 not supported on chain: ${dappChainId}`
    );
  }
}

function validateCapabilities(sendCalls) {
  const { calls, capabilities } = sendCalls;

  const requiredTopLevelCapabilities = Object.keys(capabilities ?? {}).filter(
    (name) => capabilities?.[name].optional !== true
  );

  const requiredCallCapabilities = calls.flatMap((call) =>
  Object.keys(call.capabilities ?? {}).filter(
    (name) => call.capabilities?.[name].optional !== true
  )
  );

  const requiredCapabilities = [
  ...requiredTopLevelCapabilities,
  ...requiredCallCapabilities];


  if (requiredCapabilities?.length) {
    throw new JsonRpcError(
      EIP5792ErrorCode.UnsupportedNonOptionalCapability,
      `Unsupported non-optional capabilities: ${requiredCapabilities.join(
        ', '
      )}`
    );
  }
}

async function validateSendCalls(sendCalls, req) {
  validateSendCallsVersion(sendCalls);
  await validateSendCallsChainId(sendCalls, req);
  validateCapabilities(sendCalls);
}

export async function processSendCalls(
params,
req)
{
  const { TransactionController, AccountsController } = Engine.context;
  const { calls, from: paramFrom } = params;
  const { networkClientId, origin } = req;



  const transactions = calls.map((call) => ({ params: call }));

  await validateSendCalls(params, req);

  const from =
  paramFrom ?? AccountsController.getSelectedAccount()?.address;
  const securityAlertId = uuidv4();

  const { batchId: id } = await TransactionController.addTransactionBatch({
    from,
    networkClientId,
    origin,
    securityAlertId,
    transactions,
    validateSecurity:
    ppomUtil.createValidatorForSecurityAlertId(securityAlertId)
  });

  return { id };
}

function getStatusCode(transactionMeta) {
  const { hash, status } = transactionMeta;

  if (status === TransactionStatus.confirmed) {
    return GetCallsStatusCode.CONFIRMED;
  }

  if (status === TransactionStatus.failed) {
    return hash ?
    GetCallsStatusCode.REVERTED :
    GetCallsStatusCode.FAILED_OFFCHAIN;
  }

  if (status === TransactionStatus.dropped) {
    return GetCallsStatusCode.REVERTED;
  }

  return GetCallsStatusCode.PENDING;
}








export async function getCallsStatus(id) {
  const transactions = Engine.controllerMessenger.
  call('TransactionController:getState').
  transactions.filter((tx) => tx.batchId === id);

  if (!transactions?.length) {
    throw new JsonRpcError(
      EIP5792ErrorCode.UnknownBundleId,
      `No matching bundle found`
    );
  }

  const transaction = transactions[0];
  const { chainId, txReceipt: rawTxReceipt } = transaction;
  const status = getStatusCode(transaction);
  const txReceipt = rawTxReceipt;
  const logs = txReceipt?.logs ?? [];

  const receipts = txReceipt && [
  {
    blockHash: txReceipt.blockHash,
    blockNumber: txReceipt.blockNumber,
    gasUsed: txReceipt.gasUsed,
    logs: logs.map((log) => ({
      address: log.address,
      data: log.data,
      topics: log.topics
    })),
    status: txReceipt.status,
    transactionHash: txReceipt.transactionHash
  }];


  return {
    version: VERSION,
    id,
    chainId,
    atomic: true,
    status,
    receipts
  };
}