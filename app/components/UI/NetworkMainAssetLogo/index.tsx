import React from 'react';
import PropTypes from 'prop-types';
import { ChainId } from '@metamask/controller-utils';
import { connect } from 'react-redux';
import TokenIcon from '../Swaps/components/TokenIcon';
import {
  selectChainId,
  selectEvmTicker,
} from '../../../selectors/networkController';
import { StyleProp, ViewStyle } from 'react-native';
import { RootState } from '../../../reducers';

interface NetworkMainAssetLogoProps {
  chainId: string;
  ticker: string;
  style?: StyleProp<ViewStyle>;
  big?: boolean;
  biggest?: boolean;
  testID?: string;
}

type NetworkMainAssetLogoStateProps = Pick<
  NetworkMainAssetLogoProps,
  'chainId' | 'ticker'
>;

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

const mapStateToProps = (state: RootState): NetworkMainAssetLogoStateProps => ({
  chainId: selectChainId(state),
  ticker: selectEvmTicker(state),
});

NetworkMainAssetLogo.propTypes = {
  chainId: PropTypes.string,
  ticker: PropTypes.string,
  style: PropTypes.object,
  big: PropTypes.bool,
  biggest: PropTypes.bool,
  testID: PropTypes.string,
} as React.WeakValidationMap<NetworkMainAssetLogoProps>;

export default connect(mapStateToProps)(NetworkMainAssetLogo);
