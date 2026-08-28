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
import { TokenI } from '../Tokens/types';

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

interface OwnProps {
  asset?: Partial<TokenI>;
  containerStyle?: StyleProp<ViewStyle>;
  iconStyle?: ImageStyle;
}

interface StateProps {
  tokenList: ReturnType<typeof selectTokenList>;
}

type Props = OwnProps & StateProps;

const TokenImage = ({ asset, containerStyle, iconStyle, tokenList }: Props) => {
  const isIpfsGatewayEnabled = useSelector(selectIsIpfsGatewayEnabled);

  const assetImage = asset?.image && isUrl(asset.image) ? asset.image : null;
  const address = asset?.address;
  const iconUrl =
    assetImage ||
    (address && tokenList[address]?.iconUrl) ||
    (address && tokenList[address.toLowerCase()]?.iconUrl) ||
    '';

  const isIpfsDisabledAndUriIsIpfs =
    !isIpfsGatewayEnabled && isIPFSUri(iconUrl);

  return (
    <View style={[styles.itemLogoWrapper, containerStyle, styles.roundImage]}>
      {iconUrl || !isIpfsDisabledAndUriIsIpfs ? (
        <AssetIcon address={address} logo={iconUrl} customStyle={iconStyle} />
      ) : (
        <Identicon address={address} customStyle={iconStyle} />
      )}
    </View>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  tokenList: selectTokenList(state),
});

export default connect(mapStateToProps)(TokenImage);
