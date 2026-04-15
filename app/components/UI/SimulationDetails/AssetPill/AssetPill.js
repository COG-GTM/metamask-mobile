/* eslint-disable react/prop-types */
import React from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';


import Text, {
  TextVariant } from
'../../../../component-library/components/Texts/Text';
import AvatarNetwork from '../../../../component-library/components/Avatars/Avatar/variants/AvatarNetwork';
import { AvatarSize } from '../../../../component-library/components/Avatars/Avatar/Avatar.types';
import { NetworkList } from '../../../../util/networks';
import { useStyles } from '../../../hooks/useStyles';
import Name from '../../Name/Name';
import { NameType } from '../../Name/Name.types';
import { AssetType } from '../types';
import styleSheet from './AssetPill.styles';
import { selectEvmNetworkConfigurationsByChainId } from '../../../../selectors/networkController';





const getNetworkImage = (chainId) => {
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const network = Object.values(NetworkList).find(
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (nw) => nw.chainId === chainId
  );
  return network?.imageSource || null;
};

const NativeAssetPill = ({ asset }) => {
  const { styles } = useStyles(styleSheet, {});
  const imageSource = getNetworkImage(asset.chainId);

  const networkConfigurationsByChainId = useSelector(
    selectEvmNetworkConfigurationsByChainId
  );

  const { nativeCurrency } =
  networkConfigurationsByChainId[asset.chainId] || {};

  return (
    <View style={styles.nativeAssetPill}>
      <AvatarNetwork
        testID="simulation-details-asset-pill-avatar-network"
        size={AvatarSize.Xs}
        name={nativeCurrency}
        imageSource={imageSource} />
      
      <Text variant={TextVariant.BodyMD}>{nativeCurrency}</Text>
    </View>);

};

const AssetPill = ({ asset }) => {
  const { styles } = useStyles(styleSheet, {});

  return (
    <View style={styles.assetPill}>
      {asset.type === AssetType.Native ?
      <NativeAssetPill asset={asset} /> :

      <Name
        preferContractSymbol
        testID="simulation-details-asset-pill-name"
        type={NameType.EthereumAddress}
        value={asset.address}
        variation={asset.chainId} />

      }
    </View>);

};

export default AssetPill;