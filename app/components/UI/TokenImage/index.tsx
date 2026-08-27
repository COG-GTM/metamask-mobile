/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AssetIcon from '../AssetIcon';
import Identicon from '../Identicon';
import isUrl from 'is-url';
import { connect, useSelector } from 'react-redux';
import { selectTokenList } from '../../../selectors/tokenListController';
import { selectIsIpfsGatewayEnabled } from '../../../selectors/preferencesController';
import { isIPFSUri } from '../../../util/general';

interface TokenImageProps {
  asset?: any;
  containerStyle?: any;
  iconStyle?: any;
  tokenList: Record<string, any>;
}

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

const TokenImage = ({
  asset,
  containerStyle,
  iconStyle,
  tokenList,
}: TokenImageProps) => {
  const isIpfsGatewayEnabled = useSelector(selectIsIpfsGatewayEnabled);

  const assetImage = isUrl(asset?.image) ? asset.image : null;
  const iconUrl =
    assetImage ||
    tokenList[asset?.address]?.iconUrl ||
    tokenList[asset?.address?.toLowerCase()]?.iconUrl ||
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

const mapStateToProps = (state: any) => ({
  tokenList: selectTokenList(state),
});

export default connect(mapStateToProps)(TokenImage);
