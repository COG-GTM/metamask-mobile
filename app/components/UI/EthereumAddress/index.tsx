import React, { PureComponent } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { formatAddress } from '../../../util/address';

type FormatAddressType = 'short' | 'mid' | 'full';

const formatEthereumAddress = (
  address: string | undefined,
  type: FormatAddressType | undefined,
) =>
  address === undefined ? undefined : formatAddress(address, type ?? 'full');

interface EthereumAddressProps {
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

interface EthereumAddressState {
  ensName: string | null;
  address?: string;
}

/**
 * View that renders an ethereum address
 * or its ENS name when supports reverse lookup
 */
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
      address: formatEthereumAddress(address, type),
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
    const formattedAddress = formatEthereumAddress(address, type);
    this.setState({ address: formattedAddress, ensName: null });
  }

  render() {
    return (
      <Text style={this.props.style} numberOfLines={1}>
        {this.state.address}
      </Text>
    );
  }
}

export default EthereumAddress;
