import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle, ImageStyle } from 'react-native';
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

interface Asset {
  image?: string;
  address?: string;
  symbol?: string;
  decimals?: number;
}

interface TokenListItem {
  iconUrl?: string;
}

interface TokenImageProps {
  asset?: Asset;
  containerStyle?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<ImageStyle>;
  tokenList: Record<string, TokenListItem>;
}

const TokenImage: React.FC<TokenImageProps> = ({
  asset,
  containerStyle,
  iconStyle,
  tokenList,
}) => {
  const isIpfsGatewayEnabled = useSelector(selectIsIpfsGatewayEnabled);

  const assetImage = isUrl(asset?.image || '') ? asset?.image : null;
  const iconUrl =
    assetImage ||
    tokenList[asset?.address || '']?.iconUrl ||
    tokenList[asset?.address?.toLowerCase() || '']?.iconUrl ||
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
