import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Platform, StyleProp, Text, TextStyle } from 'react-native';
import { formatAddress } from '../../../util/address';
import generateTestId from '../../../../wdio/utils/generateTestId';
// @ts-expect-error Legacy test ID module does not export this runtime property.
import { WALLET_ACCOUNT_ADDRESS_LABEL } from '../../../../wdio/screen-objects/testIDs/Screens/WalletView.testIds';

/**
 * View that renders an ethereum address
 * or its ENS name when supports reverse lookup
 */
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
  static propTypes = {
    /**
     * Styles to be applied to the text component
     */
    style: PropTypes.any,
    /**
     * Address to be rendered and resolved
     */
    address: PropTypes.string,
    /**
     * Type of formatting for the address
     * can be "short", "mid" or "full"
     */
    type: PropTypes.string,
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

// @ts-expect-error Preserve the legacy trailing defaultProps assignment.
EthereumAddress.defaultProps = {
  style: null,
  type: 'full',
};

export default EthereumAddress;
