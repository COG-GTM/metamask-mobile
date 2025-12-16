import React, { PureComponent } from 'react';
import { Platform, Text, TextStyle, StyleProp } from 'react-native';
import { formatAddress } from '../../../util/address';
import generateTestId from '../../../../wdio/utils/generateTestId';
import { WALLET_ACCOUNT_ADDRESS_LABEL } from '../../../../wdio/screen-objects/testIDs/Screens/WalletView.testIds';

interface EthereumAddressProps {
  style?: StyleProp<TextStyle>;
  address?: string;
  type?: string;
}

interface EthereumAddressState {
  ensName: string | null;
  address: string;
}

class EthereumAddress extends PureComponent<EthereumAddressProps, EthereumAddressState> {
  static defaultProps = {
    style: null,
    type: 'full',
  };

  ens: string | null = null;

  constructor(props: EthereumAddressProps) {
    super(props);
    const { address, type } = props;

    this.state = {
      ensName: null,
      address: formatAddress(address ?? '', type ?? 'full'),
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
    const formattedAddress = formatAddress(address ?? '', type ?? 'full');
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
