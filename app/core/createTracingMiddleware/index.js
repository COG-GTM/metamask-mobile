





import { trace, TraceName } from '../../util/trace';

export const MESSAGE_TYPE = {
  ETH_SIGN_TYPED_DATA: 'eth_signTypedData',
  ETH_SIGN_TYPED_DATA_V1: 'eth_signTypedData_v1',
  ETH_SIGN_TYPED_DATA_V3: 'eth_signTypedData_v3',
  ETH_SIGN_TYPED_DATA_V4: 'eth_signTypedData_v4',
  PERSONAL_SIGN: 'personal_sign',
  ADD_ETHEREUM_CHAIN: 'wallet_addEthereumChain',
  SWITCH_ETHEREUM_CHAIN: 'wallet_switchEthereumChain',
  WATCH_ASSET: 'wallet_watchAsset',
  ETH_REQUEST_ACCOUNTS: 'eth_requestAccounts'
};

const METHOD_TYPE_TO_TRACE_NAME = {
  [MESSAGE_TYPE.ETH_SIGN_TYPED_DATA]: TraceName.Signature,
  [MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V1]: TraceName.Signature,
  [MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V3]: TraceName.Signature,
  [MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4]: TraceName.Signature,
  [MESSAGE_TYPE.PERSONAL_SIGN]: TraceName.Signature
};

export default function createTracingMiddleware() {
  return async function tracingMiddleware(
  req,
  _res,
  next)
  {
    const { id, method } = req;

    const traceName = METHOD_TYPE_TO_TRACE_NAME[method];

    if (traceName) {
      req.traceContext = await trace({
        name: traceName,
        id: id
      });

      await trace({
        name: TraceName.Middleware,
        id: id,
        parentContext: req.traceContext
      });
    }

    next();
  };
}