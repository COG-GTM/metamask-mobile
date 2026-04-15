import { getAmount, getUsdAmount } from '../methods/common';

export function getTokenAmount(token)



{
  return `${getAmount(token.amount, token.decimals, {
    shouldEllipse: true
  })} ${token.symbol}`;
}

export function getTokenUSDAmount(token)



{
  return `$${getUsdAmount(token.amount, token.decimals, token.usd)}`;
}