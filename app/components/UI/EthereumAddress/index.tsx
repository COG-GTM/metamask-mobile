import React, { PureComponent } from 'react';
import { Platform, StyleProp, Text, TextStyle } from 'react-native';
import { formatAddress } from '../../../util/address';
import generateTestId from '../../../../wdio/utils/generateTestId';

const WALLET_ACCOUNT_ADDRESS_LABEL = 'wallet-account-address-label';

type FormatAddressType = 'short' | 'mid' | 'full';

interface Props {
  /**
   * Styles to be applied to the text component
   */
  style?: StyleProp<TextStyle>;
  /**
   * Address to be rendered and resolved
   */
  address?: string;
  /**
   * Type of formatting for the address
   * can be "short", "mid" or "full"
   */
  type?: FormatAddressType;
}

interface State {
  ensName: string | null;
  address: string;
}

/**
 * View that renders an ethereum address
 * or its ENS name when supports reverse lookup
 */
class EthereumAddress extends PureComponent<Props, State> {
  static defaultProps = {
    style: null,
    type: 'full' as FormatAddressType,
  };

  ens: string | null = null;

  constructor(props: Props) {
    super(props);
    const { address, type } = props;

    this.state = {
      ensName: null,
      address: formatAddress(address ?? '', type ?? 'full'),
    };
  }

  componentDidUpdate(prevProps: Props) {
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
