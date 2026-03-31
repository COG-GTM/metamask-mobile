// @ts-nocheck
import React, { PureComponent } from 'react';
import { Platform, Text } from 'react-native';
import { formatAddress } from '../../../util/address';
import generateTestId from '../../../../wdio/utils/generateTestId';
import { WALLET_ACCOUNT_ADDRESS_LABEL } from '../../../../wdio/screen-objects/testIDs/Screens/WalletView.testIds';

/**
 * View that renders an ethereum address
 * or its ENS name when supports reverse lookup
 */

interface EthereumAddressProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style?: any; // TODO: Replace "any" with type
  address?: string;
  type?: string;
}

interface EthereumAddressState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ensName?: any; // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  address?: any; // TODO: Replace "any" with type
}

class EthereumAddress extends PureComponent<EthereumAddressProps, EthereumAddressState> {
  static defaultProps = {
    style: null,
    type: 'full',
  };

  ens = null;
  constructor(props: EthereumAddressProps) {
    super(props);
    const { address, type } = props;

    this.state = {
      ensName: null,
      address: formatAddress(address, type),
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
    const formattedAddress = formatAddress(address, type);
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
