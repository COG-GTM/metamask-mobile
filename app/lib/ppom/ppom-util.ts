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
import MetaMetrics from '../../core/Analytics/MetaMetrics';
import { MetricsEventBuilder } from '../../core/Analytics/MetricsEventBuilder';
import {
  IMetaMetricsEvent,
  JsonMap,
} from '../../core/Analytics/MetaMetrics.types';
import { CONFIRMATION_EVENTS } from '../../core/Analytics/events/confirmations';

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

const SECURITY_ALERTS_API_SOURCE = 'security_alerts_api';

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

async function validateRequest(
  req: PPOMRequest,
  transactionId?: string,
  securityAlertId?: string,
) {
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
  const startTime = Date.now();

  let response: SecurityAlertResponse;

  try {
    response = await validateWithSecurityAlertsAPI(chainId, request);
  } catch (e) {
    const error = e as Error;

    trackSecurityAlertsAPIEvent(
      CONFIRMATION_EVENTS.SECURITY_ALERTS_API_REQUEST_FAILED,
      {
        chain_id: chainId,
        duration_ms: Date.now() - startTime,
        error_message: error.message,
        fallback_to_local_validation: true,
      },
    );

    Logger.error(error, {
      message: 'Error validating request with security alerts API',
      source: SECURITY_ALERTS_API_SOURCE,
      chain_id: chainId,
    });

    return await validateWithController(ppomController, request);
  }

  trackSecurityAlertsAPIEvent(
    CONFIRMATION_EVENTS.SECURITY_ALERTS_API_REQUEST_COMPLETED,
    {
      chain_id: chainId,
      duration_ms: Date.now() - startTime,
    },
  );

  return {
    ...response,
    source: SecurityAlertSource.API,
  };
}

/**
 * Submit a security alerts API metric to MetaMetrics, tagged with the
 * `security_alerts_api` source.
 *
 * Telemetry is a side effect of validation, so any analytics failure is
 * swallowed and logged rather than propagated to the validation flow.
 *
 * @param event - The analytics event to track.
 * @param properties - Additional event properties. Must not contain request
 * bodies or addresses.
 */
function trackSecurityAlertsAPIEvent(
  event: IMetaMetricsEvent,
  properties: JsonMap,
) {
  try {
    MetaMetrics.getInstance().trackEvent(
      MetricsEventBuilder.createEventBuilder(event)
        .addProperties({ ...properties, source: SECURITY_ALERTS_API_SOURCE })
        .build(),
    );
  } catch (e) {
    Logger.log(`Error tracking security alerts API metric: ${e}`);
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
  } else {
    store.dispatch(setSignatureRequestSecurityAlertResponse(response));
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

function clearSignatureSecurityAlertResponse() {
  store.dispatch(setSignatureRequestSecurityAlertResponse());
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
