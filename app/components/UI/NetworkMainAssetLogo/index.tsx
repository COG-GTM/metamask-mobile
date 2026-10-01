import React from 'react';
import { ViewStyle } from 'react-native';
import { ChainId } from '@metamask/controller-utils';
import { connect } from 'react-redux';
import TokenIcon from '../Swaps/components/TokenIcon';
import {
  selectChainId,
  selectEvmTicker,
} from '../../../selectors/networkController';
import { RootState } from '../../../reducers';

const mapStateToProps = (state: RootState) => ({
  chainId: selectChainId(state),
  ticker: selectEvmTicker(state),
});

interface NetworkMainAssetLogoOwnProps {
  style?: ViewStyle;
  big?: boolean;
  biggest?: boolean;
  testID?: string;
}

type NetworkMainAssetLogoProps = ReturnType<typeof mapStateToProps> &
  NetworkMainAssetLogoOwnProps;

function NetworkMainAssetLogo({
  chainId,
  ticker,
  style,
  big,
  biggest,
  testID,
}: NetworkMainAssetLogoProps) {
  if (chainId === ChainId.mainnet) {
    return (
      <TokenIcon
        big={big}
        biggest={biggest}
        symbol={'ETH'}
        style={style}
        testID={testID}
      />
    );
  }
  return (
    <TokenIcon
      big={big}
      biggest={biggest}
      symbol={ticker}
      style={style}
      testID={testID}
    />
  );
}

export default connect(mapStateToProps)(NetworkMainAssetLogo);
