import React from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
  type ImageStyle,
} from 'react-native';
import AssetIcon from '../AssetIcon';
import Identicon from '../Identicon';
import isUrl from 'is-url';
import { connect, useSelector } from 'react-redux';
import { selectTokenList } from '../../../selectors/tokenListController';
import { selectIsIpfsGatewayEnabled } from '../../../selectors/preferencesController';
import { isIPFSUri } from '../../../util/general';
import type { RootState } from '../../../reducers';
import type { TokenI } from '../Tokens/types';

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
  image?: string | null;
  symbol?: string;
  decimals?: number;
}

interface TokenListItem {
  iconUrl?: string;
}

interface TokenImageProps {
  asset?: TokenAsset | TokenI;
  containerStyle?: StyleProp<ViewStyle>;
  iconStyle?: ImageStyle;
  tokenList?: Record<string, TokenListItem>;
}

const TokenImage = ({
  asset,
  containerStyle,
  iconStyle,
  tokenList = {},
}: TokenImageProps) => {
  const isIpfsGatewayEnabled = useSelector(selectIsIpfsGatewayEnabled);

  const assetImage =
    asset?.image && isUrl(asset.image) ? asset.image : null;
  const assetAddress = asset?.address;
  const iconUrl =
    assetImage ||
    tokenList[assetAddress as string]?.iconUrl ||
    tokenList[assetAddress?.toLowerCase() as string]?.iconUrl ||
    '';

  const isIpfsDisabledAndUriIsIpfs =
    !isIpfsGatewayEnabled && isIPFSUri(iconUrl);

  return (
    <View style={[styles.itemLogoWrapper, containerStyle, styles.roundImage]}>
      {iconUrl || !isIpfsDisabledAndUriIsIpfs ? (
        <AssetIcon
          address={assetAddress}
          logo={iconUrl}
          customStyle={iconStyle}
        />
      ) : (
        <Identicon address={assetAddress} customStyle={iconStyle} />
      )}
    </View>
  );
};

const mapStateToProps = (state: RootState) => ({
  tokenList: selectTokenList(state),
});

export default connect(mapStateToProps)(TokenImage);
