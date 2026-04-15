import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import BottomSheet from

'../../../../component-library/components/BottomSheets/BottomSheet';
import BottomSheetHeader from '../../../../component-library/components/BottomSheets/BottomSheetHeader';
import Text from '../../../../component-library/components/Texts/Text/Text';
import Cell, {
  CellVariant } from
'../../../../component-library/components/Cells/Cell';
import ListItemSelect from '../../../../component-library/components/List/ListItemSelect';
import {
  AvatarSize,
  AvatarVariant } from
'../../../../component-library/components/Avatars/Avatar';
import { TextVariant } from '../../../../component-library/components/Texts/Text';
import Networks, { getNetworkImageSource } from '../../../../util/networks';
import { strings } from '../../../../../locales/i18n';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import images from 'images/image-icons';
import hideProtocolFromUrl from '../../../../util/hideProtocolFromUrl';
import hideKeyFromUrl from '../../../../util/hideKeyFromUrl';

import { useSelector } from 'react-redux';
import { selectIsAllNetworks } from '../../../../selectors/networkController';
import { PopularList } from '../../../../util/networks/customNetworks';
import Engine from '../../../../core/Engine/Engine';
import Logger from '../../../../util/Logger';
import { useNavigation } from '@react-navigation/native';
import Routes from '../../../../constants/navigation/Routes';




















const RpcSelectionModal = ({
  showMultiRpcSelectModal,
  closeRpcModal,
  rpcMenuSheetRef,
  networkConfigurations,
  styles
}) => {
  const isAllNetwork = useSelector(selectIsAllNetworks);

  const { navigate } = useNavigation();

  const onRpcSelect = useCallback(
    async (clientId, chainId) => {
      const { NetworkController, MultichainNetworkController } = Engine.context;
      const existingNetwork = networkConfigurations[chainId];

      const indexOfRpc = existingNetwork.rpcEndpoints.findIndex(
        ({ networkClientId }) => clientId === networkClientId
      );

      if (indexOfRpc === -1) {
        Logger.error(
          new Error(
            `RPC endpoint with clientId: ${clientId} not found for chainId: ${chainId}`
          )
        );
        return;
      }

      // Proceed to update the network with the correct index
      await NetworkController.updateNetwork(existingNetwork.chainId, {
        ...existingNetwork,
        defaultRpcEndpointIndex: indexOfRpc
      });

      // Set the active network
      MultichainNetworkController.setActiveNetwork(clientId);
      // Redirect to wallet page
      navigate(Routes.WALLET.HOME, {
        screen: Routes.WALLET.TAB_STACK_FLOW,
        params: {
          screen: Routes.WALLET_VIEW
        }
      });
    },
    [networkConfigurations, navigate]
  );

  const setTokenNetworkFilter = useCallback(
    (chainId) => {
      const isPopularNetwork =
      chainId === CHAIN_IDS.MAINNET ||
      chainId === CHAIN_IDS.LINEA_MAINNET ||
      PopularList.some((network) => network.chainId === chainId);

      const { PreferencesController } = Engine.context;
      if (!isAllNetwork && isPopularNetwork) {
        PreferencesController.setTokenNetworkFilter({
          [chainId]: true
        });
      }
    },
    [isAllNetwork]
  );
  const imageSource = useMemo(() => {
    switch (showMultiRpcSelectModal.chainId) {
      case CHAIN_IDS.MAINNET:
        return images.ETHEREUM;
      case CHAIN_IDS.LINEA_MAINNET:
        return images['LINEA-MAINNET'];
      default:
        return getNetworkImageSource({
          chainId: showMultiRpcSelectModal?.chainId?.toString()
        });
    }
  }, [showMultiRpcSelectModal.chainId]);

  if (!showMultiRpcSelectModal.isVisible) return null;

  const chainId = showMultiRpcSelectModal.chainId;
  const rpcEndpoints =
  networkConfigurations[chainId]?.rpcEndpoints || [];

  return (
    <BottomSheet
      ref={rpcMenuSheetRef}
      onClose={closeRpcModal}
      shouldNavigateBack={false}>
      
      <BottomSheetHeader style={styles.baseHeader}>
        <Text variant={TextVariant.HeadingMD}>
          {strings('app_settings.select_rpc_url')}{' '}
        </Text>
        <Cell
          variant={CellVariant.Display}
          title={Networks.mainnet.name}
          avatarProps={{
            variant: AvatarVariant.Network,
            name: showMultiRpcSelectModal.networkName,
            imageSource,
            size: AvatarSize.Sm,
            style: { marginRight: 0 }
          }}
          style={styles.cellBorder}>
          
          <Text style={styles.alternativeText} variant={TextVariant.BodyMD}>
            {showMultiRpcSelectModal.networkName}
          </Text>
        </Cell>
      </BottomSheetHeader>
      <View style={styles.rpcMenu}>
        {rpcEndpoints.map(
          ({
            url,
            networkClientId



          }) =>
          <ListItemSelect
            key={networkClientId}
            isSelected={
            networkClientId ===
            rpcEndpoints[
            networkConfigurations[chainId].
            defaultRpcEndpointIndex].
            networkClientId
            }
            isDisabled={false}
            gap={8}
            onPress={() => {
              onRpcSelect(networkClientId, chainId);
              setTokenNetworkFilter(chainId);
              closeRpcModal();
            }}>
            
              <View style={styles.rpcText}>
                <Text style={styles.textCentred}>
                  {hideKeyFromUrl(hideProtocolFromUrl(url))}
                </Text>
              </View>
            </ListItemSelect>

        )}
      </View>
    </BottomSheet>);

};

export default RpcSelectionModal;