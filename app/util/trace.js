import {
  startSpan as sentryStartSpan,
  startSpanManual,
  setMeasurement } from

'@sentry/react-native';
import {


  withIsolationScope } from
'@sentry/core';
import performance from 'react-native-performance';
import { createModuleLogger, createProjectLogger } from '@metamask/utils';

// Cannot create this 'sentry' logger in Sentry util file because of circular dependency
const projectLogger = createProjectLogger('sentry');
const log = createModuleLogger(projectLogger, 'trace');
/**
 * The supported trace names.
 */
export let TraceName = /*#__PURE__*/function (TraceName) {TraceName["DeveloperTest"] = "Developer Test";TraceName["Middleware"] = "Middleware";TraceName["NestedTest1"] = "Nested Test 1";TraceName["NestedTest2"] = "Nested Test 2";TraceName["NotificationDisplay"] = "Notification Display";TraceName["PPOMValidation"] = "PPOM Validation";TraceName["Signature"] = "Signature";TraceName["LoadScripts"] = "Load Scripts";TraceName["LoginUserInteraction"] = "Login User Interaction";TraceName["AuthenticateUser"] = "Authenticate User";TraceName["LoginBiometricAuthentication"] = "Login Biometrics Authentication";TraceName["AppStartBiometricAuthentication"] = "App start Biometrics Authentication";TraceName["EngineInitialization"] = "Engine Initialization";TraceName["UIStartup"] = "UI Startup";TraceName["NavInit"] = "Navigation Initialization";TraceName["Login"] = "Login";TraceName["NetworkSwitch"] = "Network Switch";TraceName["SwitchBuiltInNetwork"] = "Switch to Built in Network";TraceName["SwitchCustomNetwork"] = "Switch to Custom Network";TraceName["VaultCreation"] = "Login Vault Creation";TraceName["AccountList"] = "Account List";TraceName["StoreInit"] = "Store Initialization";TraceName["Tokens"] = "Tokens List";TraceName["CreateSnapAccount"] = "Create Snap Account";TraceName["AddSnapAccount"] = "Add Snap Account";TraceName["SelectAccount"] = "Select Account";TraceName["AddNetwork"] = "Add Network";TraceName["UpdateNetwork"] = "Update Network";TraceName["AssetDetails"] = "Asset Details";TraceName["ImportNfts"] = "Import Nfts";TraceName["ImportTokens"] = "Import Tokens";TraceName["RampQuoteLoading"] = "Ramp Quote Loading";TraceName["LoadRampExperience"] = "Load Ramp Experience";return TraceName;}({});



































export let TraceOperation = /*#__PURE__*/function (TraceOperation) {TraceOperation["LoadScripts"] = "load.scripts";TraceOperation["BiometricAuthentication"] = "biometrics.authentication";TraceOperation["AuthenticateUser"] = "authenticate.user";TraceOperation["EngineInitialization"] = "engine.initialization";TraceOperation["StorageRehydration"] = "storage.rehydration";TraceOperation["UIStartup"] = "ui.startup";TraceOperation["NavInit"] = "navigation.initialization";TraceOperation["NetworkSwitch"] = "network.switch";TraceOperation["SwitchBuiltInNetwork"] = "switch.to.built.in.network";TraceOperation["SwitchCustomNetwork"] = "switch.to.custom.network";TraceOperation["VaultCreation"] = "login.vault.creation";TraceOperation["AccountList"] = "account.list";TraceOperation["StoreInit"] = "store.initialization";TraceOperation["Login"] = "login";TraceOperation["CreateSnapAccount"] = "create.snap.account";TraceOperation["AddSnapAccount"] = "add.snap.account";return TraceOperation;}({});


















const ID_DEFAULT = 'default';
const OP_DEFAULT = 'custom';
export const TRACES_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

const tracesByKey = new Map();







/**
 * A context object to associate traces with each other and generate nested traces.
 */

/**
 * A callback function that can be traced.
 */

/**
 * A request to create a new trace.
 */





































/**
 * A request to end a pending trace.
 */






















/**
 * Create a Sentry transaction to analyse the duration of a code flow.
 * If a callback is provided, the transaction will be automatically ended when the callback completes.
 * If the callback returns a promise, the transaction will be ended when the promise resolves or rejects.
 * If no callback is provided, the transaction must be manually ended using `endTrace`.
 *
 * @param request - The data associated with the trace, such as the name and tags.
 * @param fn - The optional callback to record the duration of.
 * @returns The context of the trace, or the result of the callback if provided.
 */
export function trace(
request,
fn)
{
  if (!fn) {
    return startTrace(request);
  }

  return traceCallback(request, fn);
}

/**
 * End a pending trace that was started without a callback.
 * Does nothing if the pending trace cannot be found.
 *
 * @param request - The data necessary to identify and end the pending trace.
 */
export function endTrace(request) {
  const { name, timestamp } = request;
  const id = getTraceId(request);
  const key = getTraceKey(request);
  const pendingTrace = tracesByKey.get(key);

  if (!pendingTrace) {
    log('No pending trace found', name, id);
    return;
  }

  pendingTrace.end(timestamp);

  clearTimeout(pendingTrace.timeoutId);
  tracesByKey.delete(key);

  const { request: pendingRequest, startTime } = pendingTrace;
  const endTime = timestamp ?? getPerformanceTimestamp();
  const duration = endTime - startTime;

  log('Finished trace', name, id, duration, { request: pendingRequest });
}

function traceCallback(request, fn) {
  const { name } = request;

  const callback = (span) => {
    log('Starting trace', name, request);

    const start = Date.now();
    let error;

    if (span) {
      initSpan(span, request);
    }

    return tryCatchMaybePromise(
      () => fn(span),
      (currentError) => {
        error = currentError;
        throw currentError;
      },
      () => {
        const end = Date.now();
        const duration = end - start;

        log('Finished trace', name, duration, { error, request });
      }
    );
  };

  return startSpan(request, (spanOptions) =>
  sentryStartSpan(spanOptions, callback)
  );
}

function startTrace(request) {
  const { name, startTime: requestStartTime } = request;
  const startTime = requestStartTime ?? getPerformanceTimestamp();
  const id = getTraceId(request);

  const callback = (span) => {
    const end = (timestamp) => {
      span?.end(timestamp);
    };

    if (span) {
      initSpan(span, request);
    }

    const timeoutId = setTimeout(() => {
      log('Trace cleanup due to timeout', name, id);
      end();
      tracesByKey.delete(getTraceKey(request));
    }, TRACES_CLEANUP_INTERVAL);

    const pendingTrace = { end, request, startTime, timeoutId };
    const key = getTraceKey(request);
    tracesByKey.set(key, pendingTrace);

    log('Started trace', name, id, request);

    return span;
  };

  return startSpan(request, (spanOptions) =>
  startSpanManual(spanOptions, callback)
  );
}

function startSpan(
request,
callback)
{
  const { data: attributes, name, parentContext, startTime, op } = request;
  const parentSpan = parentContext ?? null;

  const spanOptions = {
    attributes,
    name,
    op: op || OP_DEFAULT,
    parentSpan,
    startTime
  };

  return withIsolationScope((scope) => {
    setScopeTags(scope, request);

    return callback(spanOptions);
  });
}

function getTraceId(request) {
  return request.id ?? ID_DEFAULT;
}

function getTraceKey(request) {
  const { name } = request;
  const id = getTraceId(request);

  return [name, id].join(':');
}

/**
 * Initialise the isolated Sentry scope created for each trace.
 * Includes setting all non-numeric tags.
 *
 * @param scope - The Sentry scope to initialise.
 * @param request - The trace request.
 */
function setScopeTags(scope, request) {
  const tags = request.tags ?? {};

  for (const [key, value] of Object.entries(tags)) {
    if (typeof value !== 'number') {
      scope.setTag(key, value);
    }
  }
}

/**
 * Initialise the Sentry span created for each trace.
 * Includes setting all numeric tags as measurements so they can be queried numerically in Sentry.
 *
 * @param _span - The Sentry span to initialise.
 * @param request - The trace request.
 */
function initSpan(_span, request) {
  const tags = request.tags ?? {};

  for (const [key, value] of Object.entries(tags)) {
    if (typeof value === 'number') {
      setMeasurement(key, value, 'none');
    }
  }
}

function getPerformanceTimestamp() {
  return performance.timeOrigin + performance.now();
}

function tryCatchMaybePromise(
tryFn,
catchFn,
finallyFn)
{
  let isPromise = false;

  try {
    const result = tryFn();

    if (result instanceof Promise) {
      isPromise = true;
      return result.catch(catchFn).finally(finallyFn);
    }

    return result;
  } catch (error) {
    if (!isPromise) {
      catchFn(error);
    }
  } finally {
    if (!isPromise) {
      finallyFn();
    }
  }

  return undefined;
}