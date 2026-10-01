import React, { PureComponent } from 'react';
import { Platform, StyleProp, Text, TextStyle } from 'react-native';
import { formatAddress } from '../../../util/address';
import generateTestId from '../../../../wdio/utils/generateTestId';

// NOTE: `WALLET_ACCOUNT_ADDRESS_LABEL` is not exported from the WalletView
// testIDs module, so this named import has always resolved to `undefined` at
// runtime. Declared locally as `undefined` to preserve the existing behavior
// while satisfying the type checker.
const WALLET_ACCOUNT_ADDRESS_LABEL: string | undefined = undefined;

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
  type?: string;
}

interface EthereumAddressState {
  ensName: string | null;
  address: string;
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

  ens: string | null = null;

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
