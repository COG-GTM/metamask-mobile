import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {



  KnownCaipNamespace,
  parseCaipAccountId,
  stringToBytes } from
'@metamask/utils';
import { Image } from 'react-native';
import Jazzicon from 'react-native-jazzicon';
import { toDataUrl } from '../../../util/blockies';


export const DIAMETERS = {
  xs: 16,
  sm: 24,
  md: 32,
  lg: 40
};







function getJazziconSeed(
namespace,
address)
{
  if (namespace === KnownCaipNamespace.Eip155) {
    // Default behaviour for EIP155 namespace to match existing Jazzicons
    return parseInt(address.slice(2, 10), 16);
  }
  return Array.from(stringToBytes(address.normalize('NFKC').toLowerCase()));
}

export const SnapUIAvatar = ({
  address,
  size = 'md'
}) => {
  const parsed = useMemo(
    () => parseCaipAccountId(address),
    [address]
  );
  const useBlockie = useSelector(
    (state) => state.settings.useBlockieIcon
  );

  const diameter = DIAMETERS[size];

  if (useBlockie) {
    return (
      <Image
        source={{ uri: toDataUrl(parsed.address) }}
        height={diameter}
        width={diameter}
        borderRadius={diameter / 2} />);


  }

  const seed = getJazziconSeed(parsed.chain.namespace, parsed.address);

  return (
    <Jazzicon
    // @ts-expect-error The underlying PRNG supports the seed being an array but the component is typed wrong.
    seed={seed}
    size={diameter} />);


};