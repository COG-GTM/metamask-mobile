import React from 'react';
import ListItemMultiSelect from '../../../component-library/components/List/ListItemMultiSelect';
import stylesheet from './MultiAssetListItems.styles';
import { useStyles } from '../../../component-library/hooks';
import Text, {
  TextVariant } from
'../../../component-library/components/Texts/Text';
import { View } from 'react-native';
import Badge, {
  BadgeVariant } from
'../../../component-library/components/Badges/Badge';
import BadgeWrapper, {
  BadgePosition } from
'../../../component-library/components/Badges/BadgeWrapper';
import AssetIcon from '../AssetIcon';
import { strings } from '../../../../locales/i18n';
import { ImportTokenViewSelectorsIDs } from '../../../../e2e/selectors/wallet/ImportTokenView.selectors';
import { NetworkBadgeSource } from '../AssetOverview/Balance/Balance';






































const MultiAssetListItems = ({
  searchResults,
  handleSelectAsset,
  selectedAsset,
  searchQuery,
  networkName
}) => {
  const { styles } = useStyles(stylesheet, {});

  return (
    <View style={styles.rowWrapper}>
      {searchResults.length === 0 && searchQuery?.length ?
      <Text style={styles.normalText}>
          {strings('token.no_tokens_found')}
        </Text> :
      null}
      {searchResults.slice(0, 6)?.map((_, i) => {
        const { symbol, name, address, iconUrl } = searchResults[i] || {};
        const isOnSelected = selectedAsset.some(
          (token) => token.address === address
        );
        const isSelected = selectedAsset && isOnSelected;

        return (
          <ListItemMultiSelect
            isSelected={isSelected}
            style={styles.base}
            key={i}
            onPress={() => handleSelectAsset(searchResults[i])}
            testID={ImportTokenViewSelectorsIDs.SEARCH_TOKEN_RESULT}>
            
            <View style={styles.Icon}>
              <BadgeWrapper
                badgePosition={BadgePosition.BottomRight}
                badgeElement={
                <Badge
                  variant={BadgeVariant.Network}
                  imageSource={NetworkBadgeSource(searchResults[i]?.chainId)}
                  name={networkName} />

                }>
                
                <AssetIcon
                  address={address}
                  logo={iconUrl}
                  customStyle={styles.assetIcon} />
                
              </BadgeWrapper>
            </View>
            <View style={styles.tokens}>
              <Text variant={TextVariant.BodyLGMedium}>{name}</Text>
              <Text variant={TextVariant.BodyMD}>{symbol}</Text>
            </View>
          </ListItemMultiSelect>);

      })}
    </View>);

};

export default MultiAssetListItems;