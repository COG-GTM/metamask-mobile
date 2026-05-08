import React from 'react';
import { StyleSheet, View } from 'react-native';
import Device from '../../../../../../../util/device';
import { useTheme } from '../../../../../../../util/theme';
import type { Colors } from '../../../../../../../util/theme/models';
import Text from '../../../../../../Base/Text';
import Spinner from '../../../../../../UI/AnimatedSpinner';

interface ApprovalFlowLoaderProps {
  /**
   * Text that will be displayed while the approval flow modal is active
   */
  loadingText?: string;
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    root: {
      backgroundColor: colors.background.default,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      paddingBottom: Device.isIphoneX() ? 20 : 0,
      minHeight: 100,
    },
    spinnerWrapper: {
      alignItems: 'center',
      marginVertical: 12,
    },
    text: {
      lineHeight: 20,
      paddingHorizontal: 24,
      fontSize: 13,
      width: '100%',
    },
  });

const ApprovalFlowLoader = ({ loadingText }: ApprovalFlowLoaderProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.root}>
      <View style={styles.spinnerWrapper}>
        <Spinner />
      </View>
      <Text primary centered noMargin style={styles.text}>
        {loadingText}
      </Text>
    </View>
  );
};

export default ApprovalFlowLoader;
