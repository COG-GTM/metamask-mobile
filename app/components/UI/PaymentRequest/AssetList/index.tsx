import React, { useCallback } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import StyledButton from '../../StyledButton';
import AssetIcon from '../../AssetIcon';
import { fontStyles } from '../../../../styles/common';
import Identicon from '../../Identicon';
import NetworkMainAssetLogo from '../../NetworkMainAssetLogo';
import { useSelector } from 'react-redux';
import { toChecksumAddress } from 'ethereumjs-util';
import { useTheme } from '../../../../util/theme';
import { selectTokenList } from '../../../../selectors/tokenListController';
import { ImportTokenViewSelectorsIDs } from '../../../../../e2e/selectors/wallet/ImportTokenView.selectors';
import { Theme } from '../../../../util/theme/models';

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    item: {
      borderWidth: 1,
      borderColor: colors.border.default,
      padding: 8,
      marginBottom: 8,
      borderRadius: 8,
    },
    assetListElement: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    text: {
      ...fontStyles.normal,
      color: colors.text.default,
    },
    textSymbol: {
      ...fontStyles.normal,
      paddingBottom: 4,
      fontSize: 16,
      color: colors.text.default,
    },
    assetInfo: {
      flex: 1,
      flexDirection: 'column',
      alignSelf: 'center',
      padding: 4,
    },
    assetIcon: {
      flexDirection: 'column',
      alignSelf: 'center',
      marginRight: 12,
    },
    ethLogo: {
      width: 50,
      height: 50,
    },
  });

interface AssetListAsset {
  address?: string;
  symbol?: string;
  name?: string;
  isETH?: boolean;
}

interface Props {
  /**
   * Array of assets objects returned from the search
   */
  searchResults: AssetListAsset[];
  /**
   * Callback triggered when a token is selected
   */
  handleSelectAsset: (asset: AssetListAsset) => void;
  /**
   * Message string to display when searchResults is empty
   */
  emptyMessage?: string;
  /**
   * Asset currently selected
   */
  selectedAsset?: unknown;
  /**
   * Current search query string
   */
  searchQuery?: string;
}

const AssetList = ({
  searchResults,
  handleSelectAsset,
  emptyMessage,
}: Props) => {
  const tokenList = useSelector(selectTokenList);
  const { colors } = useTheme();
  const styles = createStyles(colors);

  /**
   * Render logo according to asset. Could be ETH, Identicon or contractMap logo
   *
   * @param {object} asset - Asset to generate the logo to render
   */
  const renderLogo = useCallback(
    (asset: AssetListAsset) => {
      const { address, isETH } = asset;
      if (isETH || !address) {
        return <NetworkMainAssetLogo big style={styles.ethLogo} />;
      }
      const token =
        tokenList?.[toChecksumAddress(address)] ||
        tokenList?.[address.toLowerCase()];
      const iconUrl = token?.iconUrl;
      if (!iconUrl) {
        return <Identicon address={address} />;
      }
      return <AssetIcon logo={iconUrl} />;
    },
    [tokenList, styles],
  );

  return (
    <View testID={ImportTokenViewSelectorsIDs.ASSET_SEARCH_CONTAINER}>
      {
        searchResults.map((_: AssetListAsset, i: number) => {
          const { symbol, name } = searchResults[i] || {};
          return (
            <StyledButton
              type={'normal'}
              containerStyle={styles.item}
              onPress={() => handleSelectAsset(searchResults[i])} // eslint-disable-line
              key={i}
            >
              <View style={styles.assetListElement}>
                <View style={styles.assetIcon}>
                  {renderLogo(searchResults[i])}
                </View>
                <View style={styles.assetInfo}>
                  <Text style={styles.textSymbol}>{symbol}</Text>
                  {!!name && <Text style={styles.text}>{name}</Text>}
                </View>
              </View>
            </StyledButton>
          );
        })
      }
      {searchResults.length === 0 && (
        <Text style={styles.text}>{emptyMessage}</Text>
      )}
    </View>
  );
};

export default AssetList;
