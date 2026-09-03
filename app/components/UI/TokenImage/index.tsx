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

interface TokenImageAsset {
  address?: string;
  image?: string;
  symbol?: string;
  decimals?: number;
}

interface OwnProps {
  asset?: TokenImageAsset;
  containerStyle?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<ImageStyle>;
}

interface StateProps {
  tokenList: ReturnType<typeof selectTokenList>;
}

type Props = OwnProps & StateProps;

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

const TokenImage = ({ asset, containerStyle, iconStyle, tokenList }: Props) => {
  const isIpfsGatewayEnabled = useSelector(selectIsIpfsGatewayEnabled);

  const assetImage = isUrl(asset?.image || '') ? asset?.image : null;
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
          customStyle={iconStyle}
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

const mapStateToProps = (state: RootState): StateProps => ({
  tokenList: selectTokenList(state),
});

export default connect(mapStateToProps)(TokenImage);
