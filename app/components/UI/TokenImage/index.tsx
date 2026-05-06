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

// Loosely-typed asset shape — accepts TokenI from the wallet types as well as
// looser objects that only have an address.
interface TokenAsset {
  address?: string;
  image?: string;
  symbol?: string;
  decimals?: number;
  name?: string;
}

interface TokenListEntry {
  iconUrl?: string;
  [key: string]: unknown;
}

type TokenList = Record<string, TokenListEntry>;

interface OwnProps {
  asset?: TokenAsset;
  containerStyle?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<ImageStyle>;
}

interface StateProps {
  tokenList: TokenList;
}

type TokenImageProps = OwnProps & StateProps;

const TokenImage = ({
  asset,
  containerStyle,
  iconStyle,
  tokenList,
}: TokenImageProps) => {
  const isIpfsGatewayEnabled = useSelector(selectIsIpfsGatewayEnabled);

  const assetImageRaw = asset?.image;
  const assetImage =
    typeof assetImageRaw === 'string' && isUrl(assetImageRaw)
      ? assetImageRaw
      : null;
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
        <Identicon
          address={asset?.address}
          customStyle={iconStyle as ImageStyle | undefined}
        />
      )}
    </View>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  tokenList: selectTokenList(state) as TokenList,
});

export default connect(mapStateToProps)(TokenImage);
