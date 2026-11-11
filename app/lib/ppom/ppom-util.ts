import setSignatureRequestSecurityAlertResponse from '../../actions/signatureRequest';
import { setTransactionSecurityAlertResponse } from '../../actions/transaction';
import {
  Reason,
  ResultType,
  SecurityAlertResponse,
  SecurityAlertSource,
} from '../../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';
import Engine from '../../core/Engine';
import { store } from '../../store';
import { isBlockaidFeatureEnabled } from '../../util/blockaid';
import Logger from '../../util/Logger';
import { updateSecurityAlertResponse } from '../../util/transaction-controller';
import {
  TransactionMeta,
  TransactionParams,
  normalizeTransactionParams,
} from '@metamask/transaction-controller';
import { WALLET_CONNECT_ORIGIN } from '../../util/walletconnect';
import AppConstants from '../../core/AppConstants';
import {
  isSecurityAlertsAPIEnabled,
  validateWithSecurityAlertsAPI,
} from './security-alerts-api';
import { PPOMController } from '@metamask/ppom-validator';
import { Hex } from '@metamask/utils';

export interface PPOMRequest {
  method: string;
  params: unknown[];
  origin?: string;
}

const TRANSACTION_METHOD = 'eth_sendTransaction';
const TRANSACTION_METHODS = [TRANSACTION_METHOD, 'eth_sendRawTransaction'];
export const METHOD_SIGN_TYPED_DATA_V3 = 'eth_signTypedData_v3';
export const METHOD_SIGN_TYPED_DATA_V4 = 'eth_signTypedData_v4';

const CONFIRMATION_METHODS = Object.freeze([
  'eth_sendRawTransaction',
  TRANSACTION_METHOD,
  'eth_signTypedData',
  'eth_signTypedData_v1',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'personal_sign',
]);

const SECURITY_ALERT_RESPONSE_FAILED = {
  result_type: ResultType.Failed,
  reason: Reason.failed,
  description: 'Validating the confirmation failed by throwing error.',
};

const SECURITY_ALERT_RESPONSE_IN_PROGRESS = {
  result_type: ResultType.RequestInProgress,
  reason: Reason.requestInProgress,
  description: 'Validating the confirmation in progress.',
};

const PENDING_SECURITY_ALERT_TIMEOUT_MS = 5 * 60 * 1000;

interface PendingSecurityAlertResponse {
  request: PPOMRequest;
  response: SecurityAlertResponse;
  updateControllerState?: boolean;
  cleanup: () => void;
  timeout: ReturnType<typeof setTimeout>;
}

const pendingSecurityAlertResponses = new Map<
  string,
  PendingSecurityAlertResponse
>();

async function validateRequest(
  req: PPOMRequest,
  transactionId?: string,
  securityAlertId?: string,
  requestChainId?: Hex,
) {
  const {
    AccountsController,
    NetworkController,
    PPOMController: ppomController,
  } = Engine.context;

  const chainId =
    requestChainId ??
    NetworkController.getNetworkClientById(
      NetworkController.state?.selectedNetworkClientId,
    ).configuration.chainId;
  const isConfirmationMethod = CONFIRMATION_METHODS.includes(req.method);
  const isBlockaidFeatEnabled = await isBlockaidFeatureEnabled();
  if (!ppomController || !isBlockaidFeatEnabled || !isConfirmationMethod) {
    return;
  }

  if (req.method === 'eth_sendTransaction') {
    const internalAccounts = AccountsController.listAccounts();
    const { from: fromAddress, to: toAddress } = req
      ?.params?.[0] as Partial<TransactionParams>;

    if (
      internalAccounts.some(
        ({ address }: { address: string }) =>
          address?.toLowerCase() === toAddress?.toLowerCase(),
      ) &&
      toAddress !== fromAddress
    ) {
      return;
    }
  }

  const isTransaction = isTransactionRequest(req);
  let securityAlertResponse: SecurityAlertResponse | undefined;

  try {
    if (isTransaction && !transactionId && !securityAlertId) {
      securityAlertResponse = SECURITY_ALERT_RESPONSE_FAILED;
      return;
    }

    setSecurityAlertResponse(
      req,
      SECURITY_ALERT_RESPONSE_IN_PROGRESS,
      transactionId,
      { securityAlertId },
    );

    const normalizedRequest = normalizeRequest(req);

    securityAlertResponse = isSecurityAlertsAPIEnabled()
      ? await validateWithAPI(ppomController, chainId, normalizedRequest)
      : await validateWithController(ppomController, normalizedRequest);

    securityAlertResponse = {
      ...securityAlertResponse,
      req: req as unknown as Record<string, unknown>,
      chainId,
    };
  } catch (e) {
    Logger.log(`Error validating JSON RPC using PPOM: ${e}`);
  } finally {
    if (!securityAlertResponse) {
      securityAlertResponse = SECURITY_ALERT_RESPONSE_FAILED;
    }

    setSecurityAlertResponse(req, securityAlertResponse, transactionId, {
      updateControllerState: true,
      securityAlertId,
    });
  }
}

async function validateWithController(
  ppomController: PPOMController,
  request: PPOMRequest,
): Promise<SecurityAlertResponse> {
  try {
    const response = (await ppomController.usePPOM((ppom) =>
      ppom.validateJsonRpc(request as unknown as Record<string, unknown>),
    )) as SecurityAlertResponse;

    return {
      ...response,
      source: SecurityAlertSource.Local,
    };
  } catch (e) {
    Logger.log(`Error validating request with PPOM: ${e}`);
    return {
      ...SECURITY_ALERT_RESPONSE_FAILED,
      source: SecurityAlertSource.Local,
    };
  }
}

async function validateWithAPI(
  ppomController: PPOMController,
  chainId: string,
  request: PPOMRequest,
): Promise<SecurityAlertResponse> {
  try {
    const response = await validateWithSecurityAlertsAPI(chainId, request);

    return {
      ...response,
      source: SecurityAlertSource.API,
    };
  } catch (e) {
    Logger.log(`Error validating request with security alerts API: ${e}`);
    return await validateWithController(ppomController, request);
  }
}

function setSecurityAlertResponse(
  request: PPOMRequest,
  response: SecurityAlertResponse,
  transactionId?: string,
  {
    updateControllerState,
    securityAlertId,
  }: { updateControllerState?: boolean; securityAlertId?: string } = {},
) {
  if (isTransactionRequest(request)) {
    if (!transactionId && securityAlertId) {
      setSecurityAlertResponseBySecurityAlertId(
        request,
        response,
        securityAlertId,
        updateControllerState,
      );
      return;
    }

    store.dispatch(
      setTransactionSecurityAlertResponse(transactionId, response),
    );

    if (updateControllerState) {
      updateSecurityAlertResponse(
        transactionId as string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { ...response, securityAlertId } as any,
      );
    }
  } else {
    store.dispatch(setSignatureRequestSecurityAlertResponse(response));
  }
}

/**
 * Finds the ID of the transaction created with the given security alert ID.
 *
 * @param securityAlertId - The security alert ID set on the transaction metadata.
 * @returns The matching transaction ID, or undefined if no transaction exists yet.
 */
function findTransactionIdBySecurityAlertId(securityAlertId: string) {
  const { TransactionController } = Engine.context;

  return TransactionController.state.transactions.find(
    (transactionMeta: TransactionMeta) =>
      transactionMeta.securityAlertResponse?.securityAlertId ===
      securityAlertId,
  )?.id;
}

/**
 * Attaches a security alert response to the transaction with the given
 * security alert ID. Batch transactions (wallet_sendCalls) are validated
 * before the transaction exists, so if it does not exist yet the response is
 * applied when it is added, or discarded after a timeout.
 *
 * @param request - The validated request.
 * @param response - The security alert response.
 * @param securityAlertId - The security alert ID of the transaction.
 * @param updateControllerState - Whether to update TransactionController state.
 */
function setSecurityAlertResponseBySecurityAlertId(
  request: PPOMRequest,
  response: SecurityAlertResponse,
  securityAlertId: string,
  updateControllerState?: boolean,
) {
  const transactionId = findTransactionIdBySecurityAlertId(securityAlertId);

  if (transactionId) {
    pendingSecurityAlertResponses.get(securityAlertId)?.cleanup();
    setSecurityAlertResponse(request, response, transactionId, {
      updateControllerState,
      securityAlertId,
    });
    return;
  }

  const existing = pendingSecurityAlertResponses.get(securityAlertId);

  if (existing) {
    pendingSecurityAlertResponses.set(securityAlertId, {
      ...existing,
      request,
      response,
      updateControllerState,
    });
    return;
  }

  const { controllerMessenger } = Engine;

  const onTransactionAdded = (transactionMeta: TransactionMeta) => {
    if (
      transactionMeta.securityAlertResponse?.securityAlertId !== securityAlertId
    ) {
      return;
    }

    const pending = pendingSecurityAlertResponses.get(securityAlertId);
    pending?.cleanup();

    if (pending) {
      setSecurityAlertResponse(
        pending.request,
        pending.response,
        transactionMeta.id,
        {
          updateControllerState: pending.updateControllerState,
          securityAlertId,
        },
      );
    }
  };

  const cleanup = () => {
    clearTimeout(pendingSecurityAlertResponses.get(securityAlertId)?.timeout);
    pendingSecurityAlertResponses.delete(securityAlertId);
    controllerMessenger.unsubscribe(
      'TransactionController:unapprovedTransactionAdded',
      onTransactionAdded,
    );
  };

  pendingSecurityAlertResponses.set(securityAlertId, {
    request,
    response,
    updateControllerState,
    cleanup,
    timeout: setTimeout(cleanup, PENDING_SECURITY_ALERT_TIMEOUT_MS),
  });

  controllerMessenger.subscribe(
    'TransactionController:unapprovedTransactionAdded',
    onTransactionAdded,
  );
}

function isTransactionRequest(request: PPOMRequest) {
  return TRANSACTION_METHODS.includes(request.method);
}

function sanitizeRequest(request: PPOMRequest): PPOMRequest {
  // This is a temporary fix to prevent a PPOM bypass
  if (
    request.method === METHOD_SIGN_TYPED_DATA_V4 ||
    request.method === METHOD_SIGN_TYPED_DATA_V3
  ) {
    if (Array.isArray(request.params)) {
      return {
        ...request,
        params: request.params.slice(0, 2),
      };
    }
  }
  return request;
}

function normalizeRequest(request: PPOMRequest): PPOMRequest {
  if (request.method !== TRANSACTION_METHOD) {
    return sanitizeRequest(request);
  }

  request.origin = request.origin
    ?.replace(WALLET_CONNECT_ORIGIN, '')
    ?.replace(AppConstants.MM_SDK.SDK_REMOTE_ORIGIN, '');

  const transactionParams = (request.params?.[0] || {}) as TransactionParams;
  const normalizedParams = normalizeTransactionParams(transactionParams);

  return {
    ...request,
    params: [normalizedParams],
  };
}

function clearSignatureSecurityAlertResponse() {
  store.dispatch(setSignatureRequestSecurityAlertResponse());
}

function createValidatorForSecurityAlertId(securityAlertId: string) {
  return (req: PPOMRequest, chainId: Hex) =>
    validateRequest(req, undefined, securityAlertId, chainId);
}

export default {
  validateRequest,
  createValidatorForSecurityAlertId,
  clearSignatureSecurityAlertResponse,
};
