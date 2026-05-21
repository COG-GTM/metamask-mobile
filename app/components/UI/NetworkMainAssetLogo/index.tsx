import React from 'react';
import { ChainId } from '@metamask/controller-utils';
import { connect } from 'react-redux';
import TokenIcon from '../Swaps/components/TokenIcon';
import {
  selectChainId,
  selectEvmTicker,
} from '../../../selectors/networkController';
import { RootState } from '../../../reducers';
import { StyleProp, ImageStyle } from 'react-native';

interface OwnProps {
  style?: StyleProp<ImageStyle>;
  big?: boolean;
  biggest?: boolean;
  testID?: string;
}

interface StateProps {
  chainId?: string;
  ticker?: string;
}

type Props = OwnProps & StateProps;

function NetworkMainAssetLogo({
  chainId,
  ticker,
  style,
  big,
  biggest,
  testID,
}: Props) {
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

const mapStateToProps = (state: RootState): StateProps => ({
  chainId: selectChainId(state),
  ticker: selectEvmTicker(state),
});

export default connect(mapStateToProps)(NetworkMainAssetLogo);
