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

type TokenList = ReturnType<typeof selectTokenList>;

interface TokenImageAsset {
  address?: string;
  image?: string;
  symbol?: string;
  decimals?: number;
}

interface TokenImageProps {
  asset?: TokenImageAsset;
  containerStyle?: StyleProp<ViewStyle>;
  iconStyle?: ImageStyle;
  tokenList: TokenList;
}

const getTokenListIconUrl = (
  tokenList: TokenList,
  address: string | undefined,
): string | undefined => {
  if (address === undefined || Array.isArray(tokenList)) {
    return undefined;
  }
  return tokenList[address]?.iconUrl;
};

const TokenImage = ({
  asset,
  containerStyle,
  iconStyle,
  tokenList,
}: TokenImageProps) => {
  const isIpfsGatewayEnabled = useSelector(selectIsIpfsGatewayEnabled);

  const assetImage =
    asset?.image !== undefined && isUrl(asset.image) ? asset.image : null;
  const iconUrl =
    assetImage ||
    getTokenListIconUrl(tokenList, asset?.address) ||
    getTokenListIconUrl(tokenList, asset?.address?.toLowerCase()) ||
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
        <Identicon address={asset?.address} customStyle={iconStyle} />
      )}
    </View>
  );
};

const mapStateToProps = (state: RootState) => ({
  tokenList: selectTokenList(state),
});

export default connect(mapStateToProps)(TokenImage);
