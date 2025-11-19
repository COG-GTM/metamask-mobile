import React, { ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity, ViewProps, StyleProp, ViewStyle, TextStyle } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fontStyles } from '../../styles/common';
import Text from './Text';
import { useTheme } from '../../util/theme';
import { TransactionDetailsModalSelectorsIDs } from '../../../e2e/selectors/Transactions/TransactionDetailsModal.selectors';
import { Theme } from '../../util/theme/models';

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

interface DetailsModalProps extends ViewProps {
  children?: ReactNode;
}

interface DetailsModalHeaderProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
}

interface DetailsModalTitleProps extends ViewProps {
  style?: StyleProp<TextStyle>;
}

interface DetailsModalCloseIconProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
}

interface DetailsModalBodyProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
}

interface DetailsModalSectionProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
  borderBottom?: boolean;
}

interface DetailsModalSectionTitleProps extends ViewProps {
  style?: StyleProp<TextStyle>;
}

interface DetailsModalColumnProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
  end?: boolean;
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

const DetailsModalHeader = ({ style, ...props }: DetailsModalHeaderProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return <View style={[styles.header, style]} {...props} />;
};

const DetailsModalTitle = ({ style, ...props }: DetailsModalTitleProps) => {
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

const DetailsModalBody = ({ style, ...props }: DetailsModalBodyProps) => {
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
      style={[
        styles.section,
        ...(borderBottom ? [styles.sectionBorderBottom] : []),
        ...(style == null ? [] : [style]),
      ]}
      {...props}
    />
  );
};

const DetailsModalSectionTitle = ({ style, ...props }: DetailsModalSectionTitleProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return <Text style={[styles.sectionTitle, style]} {...props} />;
};

const DetailsModalColumn = ({ style, end, ...props }: DetailsModalColumnProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View
      style={[
        styles.column,
        ...(end ? [styles.columnEnd] : []),
        ...(style == null ? [] : [style]),
      ]}
      {...props}
    />
  );
};

DetailsModal.Header = DetailsModalHeader;
DetailsModal.Title = DetailsModalTitle;
DetailsModal.CloseIcon = DetailsModalCloseIcon;
DetailsModal.Body = DetailsModalBody;
DetailsModal.Section = DetailsModalSection;
DetailsModal.SectionTitle = DetailsModalSectionTitle;
DetailsModal.Column = DetailsModalColumn;

export default DetailsModal;
