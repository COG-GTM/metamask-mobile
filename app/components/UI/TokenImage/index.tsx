import React from 'react';
import {
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { TokenListMap } from '@metamask/assets-controllers';
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

interface TokenImageAsset {
  address?: string;
  symbol?: string;
  decimals?: number;
  image?: string;
}

interface OwnProps {
  asset?: TokenImageAsset;
  containerStyle?: StyleProp<ViewStyle>;
  iconStyle?: ImageStyle;
}

interface StateProps {
  tokenList: TokenListMap;
}

type TokenImageProps = OwnProps & StateProps;

const TokenImage = ({
  asset,
  containerStyle,
  iconStyle,
  tokenList,
}: TokenImageProps) => {
  const isIpfsGatewayEnabled = useSelector(selectIsIpfsGatewayEnabled);

  const assetImage = asset?.image && isUrl(asset.image) ? asset.image : null;
  const iconUrl =
    assetImage ||
    tokenList[asset?.address as string]?.iconUrl ||
    tokenList[asset?.address?.toLowerCase() as string]?.iconUrl ||
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

const mapStateToProps = (state: RootState): StateProps => ({
  tokenList: selectTokenList(state),
});

export default connect(mapStateToProps)(TokenImage);
