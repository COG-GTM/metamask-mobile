/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { PureComponent } from 'react';
import { Platform, Text } from 'react-native';
import { formatAddress } from '../../../util/address';
import generateTestId from '../../../../wdio/utils/generateTestId';
// @ts-expect-error - this legacy JavaScript test ID module has no typed export.
import { WALLET_ACCOUNT_ADDRESS_LABEL } from '../../../../wdio/screen-objects/testIDs/Screens/WalletView.testIds';

interface EthereumAddressProps {
  style?: any;
  address?: string;
  type?: 'short' | 'mid' | 'full';
}

/**
 * View that renders an ethereum address
 * or its ENS name when supports reverse lookup
 */
class EthereumAddress extends PureComponent<EthereumAddressProps> {
  static defaultProps = {
    style: null,
    type: 'full',
  };

  ens = null;
  state: { ensName: null; address: string };

  constructor(props: EthereumAddressProps) {
    super(props);
    const { address, type } = props;

    this.state = {
      ensName: null,
      address: formatAddress(
        address as string,
        type as 'short' | 'mid' | 'full',
      ),
    };
  }

  componentDidUpdate(prevProps: EthereumAddressProps) {
    if (this.props.address && prevProps.address !== this.props.address) {
      requestAnimationFrame(() => {
        this.formatAndResolveIfNeeded();
      });
    }
  }

  formatAndResolveIfNeeded() {
    const { address, type } = this.props;
    const formattedAddress = formatAddress(
      address as string,
      type as 'short' | 'mid' | 'full',
    );
    this.setState({ address: formattedAddress, ensName: null });
  }

  render() {
    return (
      <Text
        style={this.props.style}
        numberOfLines={1}
        {...generateTestId(Platform, WALLET_ACCOUNT_ADDRESS_LABEL)}
      >
        {this.state.address}
      </Text>
    );
  }
}

export default EthereumAddress;
