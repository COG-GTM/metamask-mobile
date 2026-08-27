/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-shadow, @typescript-eslint/prefer-optional-chain, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, @typescript-eslint/prefer-for-of, import/no-namespace, import/no-named-as-default-member, react/no-unstable-nested-components */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Device from '../../../../../../../util/device';
import { useTheme } from '../../../../../../../util/theme';
import Text from '../../../../../../Base/Text';
import Spinner from '../../../../../../UI/AnimatedSpinner';

// @ts-expect-error -- legacy JavaScript UI type boundary
const createStyles = (colors) =>
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

interface ApprovalFlowLoaderProps {
  loadingText?: string;
}
type Props = ApprovalFlowLoaderProps;
