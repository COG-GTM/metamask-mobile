import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { ChainId } from '@metamask/controller-utils';
import { connect } from 'react-redux';
import TokenIcon from '../Swaps/components/TokenIcon';
import {
  selectChainId,
  selectEvmTicker,
} from '../../../selectors/networkController';
import { RootState } from '../../../reducers';

interface OwnProps {
  style?: StyleProp<ViewStyle>;
  big?: boolean;
  biggest?: boolean;
  testID?: string;
}

interface StateProps {
  chainId: string;
  ticker: string;
}

type NetworkMainAssetLogoProps = OwnProps & StateProps;

function NetworkMainAssetLogo({
  chainId,
  ticker,
  style,
  big,
  biggest,
  testID,
}: NetworkMainAssetLogoProps) {
  const tokenIconStyle = style as object | undefined;
  if (chainId === ChainId.mainnet) {
    return (
      <TokenIcon
        big={big}
        biggest={biggest}
        symbol={'ETH'}
        style={tokenIconStyle}
        testID={testID}
      />
    );
  }
  return (
    <TokenIcon
      big={big}
      biggest={biggest}
      symbol={ticker}
      style={tokenIconStyle}
      testID={testID}
    />
  );
}

const mapStateToProps = (state: RootState): StateProps => ({
  chainId: selectChainId(state),
  ticker: selectEvmTicker(state),
});

export default connect(mapStateToProps)(NetworkMainAssetLogo);
