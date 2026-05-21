import React, { PureComponent } from 'react';
import { Platform, Text, StyleProp, TextStyle } from 'react-native';
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

class EthereumAddress extends PureComponent<
  EthereumAddressProps,
  EthereumAddressState
> {
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

  componentDidUpdate(prevProps: EthereumAddressProps): void {
    if (this.props.address && prevProps.address !== this.props.address) {
      requestAnimationFrame(() => {
        this.formatAndResolveIfNeeded();
      });
    }
  }

  formatAndResolveIfNeeded(): void {
    const { address, type } = this.props;
    const formattedAddress = formatAddress(address, type);
    this.setState({ address: formattedAddress, ensName: null });
  }

  render(): React.ReactNode {
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
