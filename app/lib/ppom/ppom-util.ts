import setSignatureRequestSecurityAlertResponse, {
  clearSignatureRequestSecurityAlertResponse,
} from '../../actions/signatureRequest';
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
import { ApprovalType } from '@metamask/controller-utils';
import { v4 as uuidv4 } from 'uuid';

export interface PPOMRequest {
  method: string;
  params: unknown[];
  origin?: string;
  /**
   * Read by SignatureController when the signature request is created and stored on it,
   * which binds the request to its security alert result via `securityAlertId`.
   */
  securityAlertResponse?: Record<string, unknown>;
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

const SIGNATURE_APPROVAL_TYPES: Record<string, ApprovalType> = {
  personal_sign: ApprovalType.PersonalSign,
  eth_signTypedData: ApprovalType.EthSignTypedData,
  eth_signTypedData_v1: ApprovalType.EthSignTypedData,
  eth_signTypedData_v3: ApprovalType.EthSignTypedData,
  eth_signTypedData_v4: ApprovalType.EthSignTypedData,
};

/**
 * Attaches a securityAlertId to a signature request so its validation result can only be
 * shown on the confirmation for that request. Must run synchronously before the request is
 * passed to SignatureController, which copies `req.securityAlertResponse` onto the request.
 */
function bindSignatureSecurityAlertId(
  req: PPOMRequest,
  securityAlertId?: string,
): string {
  const existingId = req.securityAlertResponse?.securityAlertId;
  if (typeof existingId === 'string' && existingId) {
    return existingId;
  }
  const id = securityAlertId ?? uuidv4();
  req.securityAlertResponse = { securityAlertId: id };
  return id;
}

/**
 * ApprovalController rejects a signature request when the same origin already has a pending
 * approval of the same type, so such a request will never be shown and must not be validated.
 */
function isRejectedDuplicateSignatureRequest(req: PPOMRequest): boolean {
  const type = SIGNATURE_APPROVAL_TYPES[req.method];
  if (!type || typeof req.origin !== 'string' || !req.origin) {
    return false;
  }
  try {
    return Boolean(
      Engine.context.ApprovalController?.has({ origin: req.origin, type }),
    );
  } catch (e) {
    Logger.log(`Error checking pending approvals for PPOM: ${e}`);
    return false;
  }
}

async function validateRequest(
  req: PPOMRequest,
  transactionId?: string,
  securityAlertId?: string,
) {
  const isConfirmationMethod = CONFIRMATION_METHODS.includes(req.method);
  const isTransaction = isTransactionRequest(req);

  if (isConfirmationMethod && !isTransaction) {
    // Both steps must happen before the first await, i.e. before the request
    // reaches SignatureController / ApprovalController.
    if (isRejectedDuplicateSignatureRequest(req)) {
      return;
    }
    securityAlertId = bindSignatureSecurityAlertId(req, securityAlertId);
  }

  const {
    AccountsController,
    NetworkController,
    PPOMController: ppomController,
  } = Engine.context;

  const {
    configuration: { chainId },
  } = NetworkController.getNetworkClientById(
    NetworkController.state?.selectedNetworkClientId,
  );
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

  let securityAlertResponse: SecurityAlertResponse | undefined;

  try {
    if (isTransaction && !transactionId) {
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
  } else if (securityAlertId) {
    store.dispatch(
      setSignatureRequestSecurityAlertResponse(securityAlertId, {
        ...response,
        securityAlertId,
      } as SecurityAlertResponse),
    );
  }
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

function clearSignatureSecurityAlertResponse(securityAlertId?: string) {
  store.dispatch(clearSignatureRequestSecurityAlertResponse(securityAlertId));
}

function createValidatorForSecurityAlertId(securityAlertId: string) {
  return (req: PPOMRequest, transactionId?: string) =>
    validateRequest(req, transactionId, securityAlertId);
}

export default {
  validateRequest,
  createValidatorForSecurityAlertId,
  clearSignatureSecurityAlertResponse,
};
