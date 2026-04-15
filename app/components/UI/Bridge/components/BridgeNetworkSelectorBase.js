import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Box } from '../../Box/Box';
import Text, { TextVariant } from '../../../../component-library/components/Texts/Text';
import { useStyles } from '../../../../component-library/hooks';

import BottomSheetHeader from '../../../../component-library/components/BottomSheets/BottomSheetHeader';
import BottomSheet from '../../../../component-library/components/BottomSheets/BottomSheet';
import Icon, { IconName } from '../../../../component-library/components/Icons/Icon';
import { IconSize } from '../../../../component-library/components/Icons/Icon/Icon.types';
import { strings } from '../../../../../locales/i18n';
import { FlexDirection, AlignItems, JustifyContent } from '../../Box/box.types';
import { useNavigation } from '@react-navigation/native';

const createStyles = (params) => {
  const { theme } = params;
  return StyleSheet.create({
    content: {
      flex: 1,
      backgroundColor: theme.colors.background.default
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center'
    },
    closeButton: {
      position: 'absolute',
      right: 0
    },
    closeIconBox: {
      padding: 8
    }
  });
};






export const BridgeNetworkSelectorBase = ({
  children
}) => {
  const { styles, theme } = useStyles(createStyles, {});
  const navigation = useNavigation();

  return (
    <BottomSheet isFullscreen>
      <Box style={styles.content}>
        <Box gap={4}>
          <BottomSheetHeader>
            <Box
              flexDirection={FlexDirection.Row}
              alignItems={AlignItems.center}
              justifyContent={JustifyContent.center}>
              
              <Text variant={TextVariant.HeadingMD} style={styles.headerTitle}>
                {strings('bridge.select_network')}
              </Text>
              <Box style={[styles.closeButton, styles.closeIconBox]}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  testID="bridge-network-selector-close-button">
                  
                  <Icon
                    name={IconName.Close}
                    size={IconSize.Sm}
                    color={theme.colors.icon.default} />
                  
                </TouchableOpacity>
              </Box>
            </Box>
          </BottomSheetHeader>
        </Box>

        <Box style={styles.content}>
          {children}
        </Box>
      </Box>
    </BottomSheet>);

};