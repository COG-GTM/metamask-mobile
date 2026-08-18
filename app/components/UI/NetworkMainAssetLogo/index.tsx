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

type NetworkMainAssetLogoOwnProps = Omit<
  NetworkMainAssetLogoProps,
  keyof NetworkMainAssetLogoStateProps
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

const mapStateToProps = (
  state: RootState,
  _ownProps: NetworkMainAssetLogoOwnProps,
): NetworkMainAssetLogoStateProps => ({
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
};

// @ts-expect-error Legacy propTypes validators do not reflect Redux-injected required props.
const connectedNetworkMainAssetLogo: React.ComponentType<NetworkMainAssetLogoProps> =
  NetworkMainAssetLogo;

export default connect<
  NetworkMainAssetLogoStateProps,
  Record<string, never>,
  NetworkMainAssetLogoOwnProps,
  RootState
>(mapStateToProps)(connectedNetworkMainAssetLogo);
