import React from 'react';
import { View, ViewProps, StyleSheet, StyleProp, ViewStyle, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fontStyles } from '../../styles/common';
import Text from './Text';
import { useTheme } from '../../util/theme';
import { TransactionDetailsModalSelectorsIDs } from '../../../e2e/selectors/Transactions/TransactionDetailsModal.selectors';
import { Theme } from '@metamask/design-tokens';

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    modalContainer: {
      width: '100%',
      backgroundColor: colors.background.default,
      borderRadius: 10,
    },
    modalView: {
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border.muted,
      flexDirection: 'row',
      paddingHorizontal: 16,
    },
    title: {
      flex: 1,
      textAlign: 'center',
      fontSize: 18,
      marginVertical: 12,
      marginHorizontal: 24,
      color: colors.text.default,
      ...fontStyles.bold,
    },
    closeIcon: { paddingTop: 4, position: 'absolute', right: 16 },
    body: {
      paddingHorizontal: 15,
    },
    section: {
      paddingVertical: 16,
      flexDirection: 'row',
    },
    sectionBorderBottom: {
      borderBottomColor: colors.border.muted,
      borderBottomWidth: 1,
    },
    column: {
      flex: 1,
    },
    columnEnd: {
      alignItems: 'flex-end',
    },
    sectionTitle: {
      ...fontStyles.normal,
      fontSize: 10,
      color: colors.text.alternative,
      marginBottom: 8,
    },
  });
interface DetailsModalProps {
  children?: React.ReactNode;
}

interface StyledViewProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
}

interface DetailsModalSectionProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
  borderBottom?: boolean;
}

interface DetailsModalColumnProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
  end?: boolean;
}

interface DetailsModalCloseIconProps extends TouchableOpacityProps {
  style?: StyleProp<ViewStyle>;
}

const DetailsModal = ({ children }: DetailsModalProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.modalView}>
      <View style={styles.modalContainer}>{children}</View>
    </View>
  );
};

const DetailsModalHeader = ({ style, ...props }: StyledViewProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return <View style={[styles.header, style]} {...props} />;
};
const DetailsModalTitle = ({ style, ...props }: StyledViewProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Text
      testID={TransactionDetailsModalSelectorsIDs.TITLE}
      style={[styles.title, style]}
      {...props}
    />
  );
};
const DetailsModalCloseIcon = ({ style, ...props }: DetailsModalCloseIconProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <TouchableOpacity
      style={[styles.closeIcon, style]}
      {...props}
      testID={TransactionDetailsModalSelectorsIDs.CLOSE_ICON}
    >
      <Ionicons color={colors.text.default} name={'close'} size={38} />
    </TouchableOpacity>
  );
};
const DetailsModalBody = ({ style, ...props }: StyledViewProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View
      testID={TransactionDetailsModalSelectorsIDs.BODY}
      style={[styles.body, style]}
      {...props}
    />
  );
};
const DetailsModalSection = ({ style, borderBottom, ...props }: DetailsModalSectionProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View
      style={[styles.section, borderBottom && styles.sectionBorderBottom]}
      {...props}
    />
  );
};
const DetailsModalSectionTitle = ({ style, ...props }: StyledViewProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return <Text style={[styles.sectionTitle, style]} {...props} />;
};
const DetailsModalColumn = ({ style, end, ...props }: DetailsModalColumnProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={[styles.column, end && styles.columnEnd, style]} {...props} />
  );
};

const DetailsModalWithSubComponents = Object.assign(DetailsModal, {
  Header: DetailsModalHeader,
  Title: DetailsModalTitle,
  CloseIcon: DetailsModalCloseIcon,
  Body: DetailsModalBody,
  Section: DetailsModalSection,
  SectionTitle: DetailsModalSectionTitle,
  Column: DetailsModalColumn,
});

export default DetailsModalWithSubComponents;
