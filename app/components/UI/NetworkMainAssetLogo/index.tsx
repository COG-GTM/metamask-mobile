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

interface OwnProps {
  style?: StyleProp<ViewStyle>;
  big?: boolean;
  biggest?: boolean;
  testID?: string;
}

interface StateProps {
  chainId: ReturnType<typeof selectChainId>;
  ticker: ReturnType<typeof selectEvmTicker>;
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
        style={style as ViewStyle}
        testID={testID}
      />
    );
  }
  return (
    <TokenIcon
      big={big}
      biggest={biggest}
      symbol={ticker}
      style={style as ViewStyle}
      testID={testID}
    />
  );
}

const mapStateToProps = (state: RootState): StateProps => ({
  chainId: selectChainId(state),
  ticker: selectEvmTicker(state),
});

export default connect(mapStateToProps)(NetworkMainAssetLogo);
