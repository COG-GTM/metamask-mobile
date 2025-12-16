import React, { ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle, TextStyle, TouchableOpacityProps } from 'react-native';
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

interface DetailsModalProps {
  children?: ReactNode;
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

interface DetailsModalHeaderProps {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

const DetailsModalHeader = ({ style, ...props }: DetailsModalHeaderProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return <View style={[styles.header, style]} {...props} />;
};

interface DetailsModalTitleProps {
  style?: StyleProp<TextStyle>;
  children?: ReactNode;
}

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

interface DetailsModalCloseIconProps extends TouchableOpacityProps {
  style?: StyleProp<ViewStyle>;
}

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

interface DetailsModalBodyProps {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

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

interface DetailsModalSectionProps {
  style?: StyleProp<ViewStyle>;
  borderBottom?: boolean;
  children?: ReactNode;
}

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

interface DetailsModalSectionTitleProps {
  style?: StyleProp<TextStyle>;
  children?: ReactNode;
}

const DetailsModalSectionTitle = ({ style, ...props }: DetailsModalSectionTitleProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return <Text style={[styles.sectionTitle, style]} {...props} />;
};

interface DetailsModalColumnProps {
  style?: StyleProp<ViewStyle>;
  end?: boolean;
  children?: ReactNode;
}

const DetailsModalColumn = ({ style, end, ...props }: DetailsModalColumnProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={[styles.column, end && styles.columnEnd, style]} {...props} />
  );
};

interface DetailsModalType extends React.FC<DetailsModalProps> {
  Header: typeof DetailsModalHeader;
  Title: typeof DetailsModalTitle;
  CloseIcon: typeof DetailsModalCloseIcon;
  Body: typeof DetailsModalBody;
  Section: typeof DetailsModalSection;
  SectionTitle: typeof DetailsModalSectionTitle;
  Column: typeof DetailsModalColumn;
}

const DetailsModalWithSubcomponents: DetailsModalType = Object.assign(DetailsModal, {
  Header: DetailsModalHeader,
  Title: DetailsModalTitle,
  CloseIcon: DetailsModalCloseIcon,
  Body: DetailsModalBody,
  Section: DetailsModalSection,
  SectionTitle: DetailsModalSectionTitle,
  Column: DetailsModalColumn,
});

export default DetailsModalWithSubcomponents;
