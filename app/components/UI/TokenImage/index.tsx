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

interface TokenListEntry {
  iconUrl?: string;
  [key: string]: unknown;
}

interface Asset {
  address?: string;
  image?: string;
  [key: string]: unknown;
}

interface StateProps {
  tokenList: Record<string, TokenListEntry>;
}

interface OwnProps {
  asset?: Asset;
  containerStyle?: StyleProp<ViewStyle>;
  iconStyle?: ImageStyle;
}

type Props = StateProps & OwnProps;

const TokenImage: React.FC<Props> = ({ asset, containerStyle, iconStyle, tokenList }) => {
  const isIpfsGatewayEnabled = useSelector(selectIsIpfsGatewayEnabled);

  const assetImage = isUrl(asset?.image ?? '') ? asset?.image : null;
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

const mapStateToProps = (state: RootState): StateProps => ({
  tokenList: selectTokenList(state) as Record<string, TokenListEntry>,
});

export default connect(mapStateToProps)(TokenImage);
