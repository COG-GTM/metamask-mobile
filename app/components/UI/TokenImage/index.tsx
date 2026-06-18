/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-shadow, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unused-vars, import/no-commonjs, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
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
}

interface Asset {
  image?: string;
  address?: string;
}

interface OwnProps {
  asset?: Asset;
  containerStyle?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<ViewStyle>;
}

interface StateProps {
  tokenList: Record<string, TokenListEntry>;
}

type Props = OwnProps & StateProps;

const TokenImage = ({ asset, containerStyle, iconStyle, tokenList }: Props) => {
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
          customStyle={iconStyle as any}
        />
      ) : (
        <Identicon address={asset?.address} customStyle={iconStyle as any} />
      )}
    </View>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  tokenList: selectTokenList(state) as unknown as Record<string, TokenListEntry>,
});

export default connect(mapStateToProps)(TokenImage);
