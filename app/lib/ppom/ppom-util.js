import setSignatureRequestSecurityAlertResponse from '../../actions/signatureRequest';
import { setTransactionSecurityAlertResponse } from '../../actions/transaction';
import {
  Reason,
  ResultType,

  SecurityAlertSource } from
'../../components/Views/confirmations/legacy/components/BlockaidBanner/BlockaidBanner.types';
import Engine from '../../core/Engine';
import { store } from '../../store';
import { isBlockaidFeatureEnabled } from '../../util/blockaid';
import Logger from '../../util/Logger';
import { updateSecurityAlertResponse } from '../../util/transaction-controller';
import {

  normalizeTransactionParams } from
'@metamask/transaction-controller';
import { WALLET_CONNECT_ORIGIN } from '../../util/walletconnect';
import AppConstants from '../../core/AppConstants';
import {
  isSecurityAlertsAPIEnabled,
  validateWithSecurityAlertsAPI } from
'./security-alerts-api';








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
'personal_sign']
);

const SECURITY_ALERT_RESPONSE_FAILED = {
  result_type: ResultType.Failed,
  reason: Reason.failed,
  description: 'Validating the confirmation failed by throwing error.'
};

const SECURITY_ALERT_RESPONSE_IN_PROGRESS = {
  result_type: ResultType.RequestInProgress,
  reason: Reason.requestInProgress,
  description: 'Validating the confirmation in progress.'
};

async function validateRequest(
req,
transactionId,
securityAlertId)
{
  const {
    AccountsController,
    NetworkController,
    PPOMController: ppomController
  } = Engine.context;

  const {
    configuration: { chainId }
  } = NetworkController.getNetworkClientById(
    NetworkController.state?.selectedNetworkClientId
  );
  const isConfirmationMethod = CONFIRMATION_METHODS.includes(req.method);
  const isBlockaidFeatEnabled = await isBlockaidFeatureEnabled();
  if (!ppomController || !isBlockaidFeatEnabled || !isConfirmationMethod) {
    return;
  }

  if (req.method === 'eth_sendTransaction') {
    const internalAccounts = AccountsController.listAccounts();
    const { from: fromAddress, to: toAddress } = req?.
    params?.[0];

    if (
    internalAccounts.some(
      ({ address }) =>
      address?.toLowerCase() === toAddress?.toLowerCase()
    ) &&
    toAddress !== fromAddress)
    {
      return;
    }
  }

  const isTransaction = isTransactionRequest(req);
  let securityAlertResponse;

  try {
    if (isTransaction && !transactionId) {
      securityAlertResponse = SECURITY_ALERT_RESPONSE_FAILED;
      return;
    }

    setSecurityAlertResponse(
      req,
      SECURITY_ALERT_RESPONSE_IN_PROGRESS,
      transactionId,
      { securityAlertId }
    );

    const normalizedRequest = normalizeRequest(req);

    securityAlertResponse = isSecurityAlertsAPIEnabled() ?
    await validateWithAPI(ppomController, chainId, normalizedRequest) :
    await validateWithController(ppomController, normalizedRequest);

    securityAlertResponse = {
      ...securityAlertResponse,
      req: req,
      chainId
    };
  } catch (e) {
    Logger.log(`Error validating JSON RPC using PPOM: ${e}`);
  } finally {
    if (!securityAlertResponse) {
      securityAlertResponse = SECURITY_ALERT_RESPONSE_FAILED;
    }

    setSecurityAlertResponse(req, securityAlertResponse, transactionId, {
      updateControllerState: true,
      securityAlertId
    });
  }
}

async function validateWithController(
ppomController,
request)
{
  try {
    const response = await ppomController.usePPOM((ppom) =>
    ppom.validateJsonRpc(request)
    );

    return {
      ...response,
      source: SecurityAlertSource.Local
    };
  } catch (e) {
    Logger.log(`Error validating request with PPOM: ${e}`);
    return {
      ...SECURITY_ALERT_RESPONSE_FAILED,
      source: SecurityAlertSource.Local
    };
  }
}

async function validateWithAPI(
ppomController,
chainId,
request)
{
  try {
    const response = await validateWithSecurityAlertsAPI(chainId, request);

    return {
      ...response,
      source: SecurityAlertSource.API
    };
  } catch (e) {
    Logger.log(`Error validating request with security alerts API: ${e}`);
    return await validateWithController(ppomController, request);
  }
}

function setSecurityAlertResponse(
request,
response,
transactionId,
{
  updateControllerState,
  securityAlertId
} = {})
{
  if (isTransactionRequest(request)) {
    store.dispatch(
      setTransactionSecurityAlertResponse(transactionId, response)
    );

    if (updateControllerState) {
      updateSecurityAlertResponse(
        transactionId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { ...response, securityAlertId }
      );
    }
  } else {
    store.dispatch(setSignatureRequestSecurityAlertResponse(response));
  }
}

function isTransactionRequest(request) {
  return TRANSACTION_METHODS.includes(request.method);
}

function sanitizeRequest(request) {
  // This is a temporary fix to prevent a PPOM bypass
  if (
  request.method === METHOD_SIGN_TYPED_DATA_V4 ||
  request.method === METHOD_SIGN_TYPED_DATA_V3)
  {
    if (Array.isArray(request.params)) {
      return {
        ...request,
        params: request.params.slice(0, 2)
      };
    }
  }
  return request;
}

function normalizeRequest(request) {
  if (request.method !== TRANSACTION_METHOD) {
    return sanitizeRequest(request);
  }

  request.origin = request.origin?.
  replace(WALLET_CONNECT_ORIGIN, '')?.
  replace(AppConstants.MM_SDK.SDK_REMOTE_ORIGIN, '');

  const transactionParams = request.params?.[0] || {};
  const normalizedParams = normalizeTransactionParams(transactionParams);

  return {
    ...request,
    params: [normalizedParams]
  };
}

function clearSignatureSecurityAlertResponse() {
  store.dispatch(setSignatureRequestSecurityAlertResponse());
}

function createValidatorForSecurityAlertId(securityAlertId) {
  return (req, transactionId) =>
  validateRequest(req, transactionId, securityAlertId);
}

export default {
  validateRequest,
  createValidatorForSecurityAlertId,
  clearSignatureSecurityAlertResponse
};