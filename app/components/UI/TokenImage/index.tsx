import React from 'react';
import {
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import AssetIcon from '../AssetIcon';
import Identicon from '../Identicon';
import isUrl from 'is-url';
import { connect, useSelector } from 'react-redux';
import { selectTokenList } from '../../../selectors/tokenListController';
import { selectIsIpfsGatewayEnabled } from '../../../selectors/preferencesController';
import { isIPFSUri } from '../../../util/general';
import { RootState } from '../../../reducers';

const styles = StyleSheet.create({
  itemLogoWrapper: {
    width: 50,
    height: 50,
  },
  roundImage: {
    overflow: 'hidden',
    borderRadius: 25,
  },
});

interface TokenAsset {
  address?: string;
  image?: string;
  symbol?: string;
  name?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface TokenImageProps {
  asset?: TokenAsset;
  containerStyle?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<ImageStyle>;
  tokenList: Record<string, { iconUrl?: string } | undefined>;
}

const TokenImage = ({
  asset,
  containerStyle,
  iconStyle,
  tokenList,
}: TokenImageProps) => {
  const isIpfsGatewayEnabled = useSelector(selectIsIpfsGatewayEnabled);

  const assetImage = isUrl(asset?.image as string) ? asset?.image : null;
  const iconUrl =
    assetImage ||
    (asset?.address ? tokenList[asset.address]?.iconUrl : undefined) ||
    (asset?.address
      ? tokenList[asset.address.toLowerCase()]?.iconUrl
      : undefined) ||
    '';

  const isIpfsDisabledAndUriIsIpfs =
    !isIpfsGatewayEnabled && isIPFSUri(iconUrl);

  return (
    <View style={[styles.itemLogoWrapper, containerStyle, styles.roundImage]}>
      {iconUrl || !isIpfsDisabledAndUriIsIpfs ? (
        <AssetIcon
          address={asset?.address}
          logo={iconUrl}
          customStyle={iconStyle as ImageStyle}
        />
      ) : (
        <Identicon
          address={asset?.address}
          customStyle={iconStyle as ImageStyle}
        />
      )}
    </View>
  );
};

const mapStateToProps = (state: RootState) => ({
  tokenList: selectTokenList(state),
});

export default connect(mapStateToProps)(TokenImage);
