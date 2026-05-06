import React from 'react';
import { ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import AssetIcon from '../AssetIcon';
import Identicon from '../Identicon';
import isUrl from 'is-url';
import { connect, useSelector } from 'react-redux';
import { selectTokenList } from '../../../selectors/tokenListController';
import { selectIsIpfsGatewayEnabled } from '../../../selectors/preferencesController';
import { isIPFSUri } from '../../../util/general';

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

interface Asset {
  image?: string;
  address?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface TokenListEntry {
  iconUrl?: string;
}

interface Props {
  asset?: Asset;
  containerStyle?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<ImageStyle>;
  tokenList?: Record<string, TokenListEntry>;
}

const TokenImage = ({ asset, containerStyle, iconStyle, tokenList }: Props) => {
  const isIpfsGatewayEnabled = useSelector(selectIsIpfsGatewayEnabled);

  const assetImage = isUrl(asset?.image ?? '') ? asset?.image : null;
  const iconUrl =
    assetImage ||
    (asset?.address && tokenList?.[asset.address]?.iconUrl) ||
    (asset?.address && tokenList?.[asset.address.toLowerCase()]?.iconUrl) ||
    '';

  const isIpfsDisabledAndUriIsIpfs =
    !isIpfsGatewayEnabled && isIPFSUri(iconUrl);

  return (
    <View style={[styles.itemLogoWrapper, containerStyle, styles.roundImage]}>
      {iconUrl || !isIpfsDisabledAndUriIsIpfs ? (
        <AssetIcon
          address={asset?.address}
          logo={iconUrl}
          customStyle={iconStyle}
        />
      ) : (
        <Identicon
          address={asset?.address}
          customStyle={iconStyle as ImageStyle | undefined}
        />
      )}
    </View>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapStateToProps = (state: any) => ({
  tokenList: selectTokenList(state),
});

export default connect(mapStateToProps)(TokenImage);
