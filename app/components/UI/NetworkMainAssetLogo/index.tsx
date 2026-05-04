import React from 'react';
import { ChainId } from '@metamask/controller-utils';
import { connect } from 'react-redux';
import TokenIcon from '../Swaps/components/TokenIcon';
import {
  selectChainId,
  selectEvmTicker,
} from '../../../selectors/networkController';
import { ImageStyle, StyleProp } from 'react-native';

interface NetworkMainAssetLogoOwnProps {
  style?: StyleProp<ImageStyle>;
  big?: boolean;
  biggest?: boolean;
  testID?: string;
}

interface NetworkMainAssetLogoStateProps {
  chainId?: string;
  ticker?: string;
}

type NetworkMainAssetLogoProps = NetworkMainAssetLogoOwnProps & NetworkMainAssetLogoStateProps;

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

const mapStateToProps = (state: Record<string, unknown>): NetworkMainAssetLogoStateProps => ({
  chainId: selectChainId(state),
  ticker: selectEvmTicker(state),
});

export default connect(mapStateToProps)(NetworkMainAssetLogo);
