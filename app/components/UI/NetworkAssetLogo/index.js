import React from 'react';
import { ChainId } from '@metamask/controller-utils';
import TokenIcon from '../Swaps/components/TokenIcon';










function NetworkAssetLogo({
  chainId,
  ticker,
  style,
  big,
  biggest,
  testID
}) {
  if (chainId === ChainId.mainnet) {
    return (
      <TokenIcon
        big={big}
        biggest={biggest}
        symbol={'ETH'}
        style={style}
        testID={testID} />);


  }
  return (
    <TokenIcon
      big={big}
      biggest={biggest}
      symbol={ticker}
      style={style}
      testID={testID} />);


}

export default NetworkAssetLogo;