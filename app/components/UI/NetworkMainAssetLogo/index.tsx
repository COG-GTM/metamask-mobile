/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-shadow, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unused-vars, import/no-commonjs, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
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
  chainId: string;
  ticker: string;
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
        style={style as any}
        testID={testID}
      />
    );
  }
  return (
    <TokenIcon
      big={big}
      biggest={biggest}
      symbol={ticker}
      style={style as any}
      testID={testID}
    />
  );
}

const mapStateToProps = (state: RootState): StateProps => ({
  chainId: selectChainId(state),
  ticker: selectEvmTicker(state),
});

export default connect(mapStateToProps)(NetworkMainAssetLogo);
