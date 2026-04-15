import React, { useCallback } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Box } from '../../../Box/Box';
import { useStyles } from '../../../../../component-library/hooks';
import {
  selectEnabledDestChains,
  setSelectedDestChainId } from
'../../../../../core/redux/slices/bridge';
import ListItem from '../../../../../component-library/components/List/ListItem/ListItem';
import { VerticalAlignment } from '../../../../../component-library/components/List/ListItem/ListItem.types';

import { BridgeNetworkSelectorBase } from '../BridgeNetworkSelectorBase';
import { NetworkRow } from '../NetworkRow';
import Routes from '../../../../../constants/navigation/Routes';
import { selectChainId } from '../../../../../selectors/networkController';
import { BridgeViewMode } from '../../types';




const createStyles = () => StyleSheet.create({
  listContent: {
    padding: 8
  }
});

export const BridgeDestNetworkSelector = () => {
  const { styles } = useStyles(createStyles, {});
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const enabledDestChains = useSelector(selectEnabledDestChains);
  const currentChainId = useSelector(selectChainId);

  const handleChainSelect = useCallback((chainId) => {
    dispatch(setSelectedDestChainId(chainId));

    navigation.goBack();

    if (route.params.shouldGoToTokens) {
      navigation.navigate(Routes.BRIDGE.MODALS.ROOT, {
        screen: Routes.BRIDGE.MODALS.DEST_TOKEN_SELECTOR,
        params: {
          bridgeViewMode: BridgeViewMode.Bridge
        }
      });
    }
  }, [dispatch, navigation, route.params.shouldGoToTokens]);

  const renderDestChains = useCallback(() =>
  enabledDestChains.filter((chain) => chain.chainId !== currentChainId).map((chain) =>
  <TouchableOpacity
    key={chain.chainId}
    onPress={() => handleChainSelect(chain.chainId)}>
    
        <ListItem
      verticalAlignment={VerticalAlignment.Center}>
      
          <NetworkRow
        chainId={chain.chainId}
        chainName={chain.name} />
      
        </ListItem>
      </TouchableOpacity>
  ),
  [enabledDestChains, handleChainSelect, currentChainId]);

  return (
    <BridgeNetworkSelectorBase>
      <Box style={styles.listContent}>
        {renderDestChains()}
      </Box>
    </BridgeNetworkSelectorBase>);

};