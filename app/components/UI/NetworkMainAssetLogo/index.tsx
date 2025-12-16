import React from 'react';
import { ChainId } from '@metamask/controller-utils';
import { connect } from 'react-redux';
import { StyleProp, ViewStyle } from 'react-native';
import TokenIcon from '../Swaps/components/TokenIcon';
import {
  selectChainId,
  selectEvmTicker,
} from '../../../selectors/networkController';
import { RootState } from '../../../reducers';

interface NetworkMainAssetLogoProps {
  chainId?: string;
  ticker?: string;
  style?: StyleProp<ViewStyle>;
  big?: boolean;
  biggest?: boolean;
  testID?: string;
}

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

const mapStateToProps = (state: RootState) => ({
  chainId: selectChainId(state),
  ticker: selectEvmTicker(state),
});

export default connect(mapStateToProps)(NetworkMainAssetLogo);
