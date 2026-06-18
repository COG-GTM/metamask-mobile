import React from 'react';
import { StyleSheet, View } from 'react-native';
import Device from '../../../../../../../util/device';
import { useTheme } from '../../../../../../../util/theme';
import Text from '../../../../../../Base/Text';
import Spinner from '../../../../../../UI/AnimatedSpinner';

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createStyles = (colors: any) =>
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ApprovalFlowLoader = ({ loadingText }: any) => {
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
