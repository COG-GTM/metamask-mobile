import React from 'react';
import {
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import isUrl from 'is-url';
import { connect, useSelector } from 'react-redux';
import AssetIcon from '../AssetIcon';
import Identicon from '../Identicon';
import { selectTokenList } from '../../../selectors/tokenListController';
import { selectIsIpfsGatewayEnabled } from '../../../selectors/preferencesController';
import { isIPFSUri } from '../../../util/general';
import { TokenI } from '../Tokens/types';
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

const mapStateToProps = (state: RootState) => ({
  tokenList: selectTokenList(state),
});

interface TokenImageOwnProps {
  asset?: Partial<TokenI>;
  containerStyle?: StyleProp<ViewStyle>;
  iconStyle?: ImageStyle;
}

type TokenImageProps = ReturnType<typeof mapStateToProps> & TokenImageOwnProps;

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
    tokenList[asset?.address ?? '']?.iconUrl ||
    tokenList[asset?.address?.toLowerCase() ?? '']?.iconUrl ||
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

export default connect(mapStateToProps)(TokenImage);
