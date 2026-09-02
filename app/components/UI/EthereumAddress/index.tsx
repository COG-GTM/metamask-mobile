import React, { useEffect, useRef, useState } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { formatAddress } from '../../../util/address';

interface EthereumAddressProps {
  /**
   * Styles to be applied to the text component
   */
  style?: StyleProp<TextStyle>;
  /**
   * Address to be rendered and resolved
   */
  address: string;
  /**
   * Type of formatting for the address
   * can be "short", "mid" or "full"
   */
  type?: 'short' | 'mid' | 'full';
}

/**
 * View that renders an ethereum address
 * or its ENS name when supports reverse lookup
 */
const EthereumAddress = ({
  style = null,
  address,
  type = 'full',
}: EthereumAddressProps) => {
  const [formattedAddress, setFormattedAddress] = useState(() =>
    formatAddress(address, type),
  );
  const prevAddressRef = useRef(address);

  useEffect(() => {
    if (address && prevAddressRef.current !== address) {
      requestAnimationFrame(() => {
        setFormattedAddress(formatAddress(address, type));
      });
    }
    prevAddressRef.current = address;
  }, [address, type]);

  return (
    <Text style={style} numberOfLines={1}>
      {formattedAddress}
    </Text>
  );
};

export default EthereumAddress;
