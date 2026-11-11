import { RampIntent } from '../types';

const DECIMAL_CHAIN_ID_REGEX = /^[1-9]\d*$/u;

function parseChainId(chainId: string | undefined) {
  return chainId && DECIMAL_CHAIN_ID_REGEX.test(chainId) ? chainId : undefined;
}

export default function parseRampIntent(
  pathParams: Record<string, string | undefined>,
): RampIntent | undefined {
  // create a rampIntent object if the pathParams contain the necessary fields
  const rampIntent: RampIntent = {
    address: pathParams.address,
    chainId: parseChainId(pathParams.chainId),
    amount: pathParams.amount,
    currency: pathParams.currency,
  };

  // return with undefined if the pathParams do not contain necessary fields
  if (
    !rampIntent.address &&
    !rampIntent.chainId &&
    !rampIntent.amount &&
    !rampIntent.currency
  ) {
    return undefined;
  }

  if (rampIntent.address && pathParams.chainId === undefined) {
    rampIntent.chainId = '1';
  }

  Object.keys(rampIntent).forEach(
    (key) =>
      rampIntent[key as keyof RampIntent] === undefined &&
      delete rampIntent[key as keyof RampIntent],
  );

  return rampIntent;
}
