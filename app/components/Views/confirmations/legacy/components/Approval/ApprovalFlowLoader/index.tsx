import React from 'react';
import { StyleSheet, View, ViewStyle, TextStyle } from 'react-native';
import Device from '../../../../../../../util/device';
import { useTheme } from '../../../../../../../util/theme';
import { Colors } from '../../../../../../../util/theme/models';
import Text from '../../../../../../Base/Text';
import Spinner from '../../../../../../UI/AnimatedSpinner';

const createStyles = (colors: Colors) =>
  StyleSheet.create<{
    root: ViewStyle;
    spinnerWrapper: ViewStyle;
    text: TextStyle;
  }>({
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

interface Props {
  /**
   * Text that will be displayed while the approval flow modal is active
   */
  loadingText?: string | null;
}

const ApprovalFlowLoader = ({ loadingText }: Props) => {
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
