import React, { ReactNode } from 'react';
import { View, StyleSheet, StyleProp, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fontStyles } from '../../styles/common';
import Text from './Text';
import { useTheme } from '../../util/theme';
import { TransactionDetailsModalSelectorsIDs } from '../../../e2e/selectors/Transactions/TransactionDetailsModal.selectors';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createStyles = (colors: any) =>
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

interface StyledProps {
  style?: StyleProp<ViewStyle> | StyleProp<TextStyle>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface SectionProps extends StyledProps {
  /**
   * Adds a border to the bottom of the section
   */
  borderBottom?: boolean;
}

interface ColumnProps extends StyledProps {
  /**
   * Aligns column content to flex-end
   */
  end?: boolean;
}

interface DetailsModalCompound {
  (props: DetailsModalProps): React.ReactElement;
  Header: (props: StyledProps) => React.ReactElement;
  Title: (props: StyledProps) => React.ReactElement;
  CloseIcon: (props: StyledProps) => React.ReactElement;
  Body: (props: StyledProps) => React.ReactElement;
  Section: (props: SectionProps) => React.ReactElement;
  SectionTitle: (props: StyledProps) => React.ReactElement;
  Column: (props: ColumnProps) => React.ReactElement;
}

const DetailsModal = (({ children }: DetailsModalProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.modalView}>
      <View style={styles.modalContainer}>{children}</View>
    </View>
  );
}) as DetailsModalCompound;

const DetailsModalHeader = ({ style, ...props }: StyledProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return <View style={[styles.header, style as StyleProp<ViewStyle>]} {...props} />;
};
const DetailsModalTitle = ({ style, ...props }: StyledProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Text
      testID={TransactionDetailsModalSelectorsIDs.TITLE}
      style={[styles.title, style as StyleProp<TextStyle>]}
      {...props}
    />
  );
};
const DetailsModalCloseIcon = ({ style, ...props }: StyledProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <TouchableOpacity
      style={[styles.closeIcon, style as StyleProp<ViewStyle>]}
      {...props}
      testID={TransactionDetailsModalSelectorsIDs.CLOSE_ICON}
    >
      <Ionicons color={colors.text.default} name={'close'} size={38} />
    </TouchableOpacity>
  );
};
const DetailsModalBody = ({ style, ...props }: StyledProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View
      testID={TransactionDetailsModalSelectorsIDs.BODY}
      style={[styles.body, style as StyleProp<ViewStyle>]}
      {...props}
    />
  );
};
const DetailsModalSection = ({ borderBottom, ...props }: SectionProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View
      style={[styles.section, borderBottom && styles.sectionBorderBottom]}
      {...props}
    />
  );
};
const DetailsModalSectionTitle = ({ style, ...props }: StyledProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return <Text style={[styles.sectionTitle, style as StyleProp<TextStyle>]} {...props} />;
};
const DetailsModalColumn = ({ style, end, ...props }: ColumnProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View
      style={[styles.column, end && styles.columnEnd, style as StyleProp<ViewStyle>]}
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
