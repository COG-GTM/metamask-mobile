import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { Box } from '../../Box/Box';
import Text, { TextColor, TextVariant } from '../../../../component-library/components/Texts/Text';
import { useStyles } from '../../../../component-library/hooks';



import { getNetworkImageSource } from '../../../../util/networks';
import { FlexDirection, AlignItems, JustifyContent } from '../../Box/box.types';
import { strings } from '../../../../../locales/i18n';

import { IconName } from '../../../../component-library/components/Icons/Icon';
import Button, { ButtonVariants } from '../../../../component-library/components/Buttons/Button';
import Routes from '../../../../constants/navigation/Routes';
import { useNavigation } from '@react-navigation/native';
import AvatarNetwork from '../../../../component-library/components/Avatars/Avatar/variants/AvatarNetwork/AvatarNetwork';
import { AvatarSize } from '../../../../component-library/components/Avatars/Avatar';

const createStyles = (params) => {
  const { theme } = params;
  return StyleSheet.create({
    networksButton: {
      borderColor: theme.colors.border.muted
    },
    avatarContainer: {
    },
    avatarNetwork: {
      marginRight: 0
    },
    networkOverflowCircle: {
      backgroundColor: theme.colors.overlay.default,
      width: 16,
      height: 16,
      borderRadius: 8,
      marginLeft: -8
    }
  });
};

export const MAX_NETWORK_ICONS = 3;








export const BridgeSourceNetworksBar = ({
  networksToShow,
  networkConfigurations,
  selectedSourceChainIds,
  enabledSourceChains
}) => {
  const { styles } = useStyles(createStyles, {});
  const navigation = useNavigation();

  let networkText = '';
  if (selectedSourceChainIds.length === enabledSourceChains.length) {
    networkText = strings('bridge.all_networks');
  } else if (selectedSourceChainIds.length === 1) {
    networkText = strings('bridge.one_network');
  } else {
    networkText = strings('bridge.num_networks', { numNetworks: selectedSourceChainIds.length });
  }

  const navigateToNetworkSelector = () => {
    navigation.navigate(Routes.BRIDGE.MODALS.ROOT, {
      screen: Routes.BRIDGE.MODALS.SOURCE_NETWORK_SELECTOR
    });
  };

  const renderSourceNetworks = useCallback(() =>
  networksToShow.map(({ chainId }) =>
  <Box key={chainId} style={styles.avatarContainer}>
      <AvatarNetwork
      key={chainId}
      imageSource={getNetworkImageSource({ chainId })}
      name={networkConfigurations[chainId]?.name}
      size={AvatarSize.Xs}
      style={styles.avatarNetwork} />
    
      </Box>
  ),
  [networkConfigurations, styles, networksToShow]);

  return (
    <Button
      onPress={navigateToNetworkSelector}
      variant={ButtonVariants.Secondary}
      label={
      <Box flexDirection={FlexDirection.Row} alignItems={AlignItems.center} gap={4}>
        <Box flexDirection={FlexDirection.Row} alignItems={AlignItems.center} gap={-8}>
          {renderSourceNetworks()}
          {selectedSourceChainIds.length > MAX_NETWORK_ICONS &&
          <Box style={styles.networkOverflowCircle} justifyContent={JustifyContent.center} alignItems={AlignItems.center}>
              <Text variant={TextVariant.BodyXS} color={TextColor.Inverse}>+{selectedSourceChainIds.length - MAX_NETWORK_ICONS}</Text>
            </Box>
          }
        </Box>
        <Text>{networkText}</Text>
      </Box>
      }
      style={styles.networksButton}
      endIconName={IconName.ArrowDown} />);


};