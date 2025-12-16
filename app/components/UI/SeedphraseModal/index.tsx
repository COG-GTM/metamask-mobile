import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { fontStyles } from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
import ActionModal from '../../UI/ActionModal';
import { useTheme } from '../../../util/theme';
import { Theme } from '../../../util/theme/models';

interface Styles {
  whatIsSeedphraseTitle: TextStyle;
  modalNoBorder: ViewStyle;
  modalContainer: ViewStyle;
  modalXButton: ViewStyle;
  titleContainer: ViewStyle;
  auxCenterView: ViewStyle;
  explanationText: TextStyle;
  modalXIcon: TextStyle;
}

const createStyles = (colors: Theme['colors']): Styles =>
  StyleSheet.create({
    whatIsSeedphraseTitle: {
      flex: 1,
      fontSize: 18,
      color: colors.text.default,
      textAlign: 'center',
      ...fontStyles.bold,
    },
    modalNoBorder: {
      borderTopWidth: 0,
    },
    modalContainer: {
      flex: 1,
      padding: 27,
      flexDirection: 'column',
    },
    modalXButton: {
      padding: 5,
      alignItems: 'flex-end',
    },
    titleContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    auxCenterView: {
      width: 26,
    },
    explanationText: {
      fontSize: 14,
      marginTop: 16,
      textAlign: 'center',
      ...fontStyles.normal,
      color: colors.text.default,
      lineHeight: 20,
    },
    modalXIcon: {
      fontSize: 16,
      color: colors.text.default,
    },
  });

interface SeedphraseModalProps {
  showWhatIsSeedphraseModal?: boolean;
  hideWhatIsSeedphrase?: () => void;
}

const SeedphraseModal: React.FC<SeedphraseModalProps> = ({
  showWhatIsSeedphraseModal,
  hideWhatIsSeedphrase,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <ActionModal
      modalVisible={showWhatIsSeedphraseModal}
      actionContainerStyle={styles.modalNoBorder}
      displayConfirmButton={false}
      displayCancelButton={false}
      onRequestClose={hideWhatIsSeedphrase}
    >
      <View style={styles.modalContainer}>
        <View style={styles.titleContainer}>
          <View style={styles.auxCenterView} />
          <Text style={styles.whatIsSeedphraseTitle}>
            {strings('account_backup_step_1.what_is_seedphrase_title')}
          </Text>
          <TouchableOpacity
            onPress={hideWhatIsSeedphrase}
            style={styles.modalXButton}
            hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}
          >
            <Icon name="times" style={styles.modalXIcon} />
          </TouchableOpacity>
        </View>
        <View>
          <Text style={styles.explanationText}>
            {strings('account_backup_step_1.what_is_seedphrase_text_1')}
          </Text>
          <Text style={styles.explanationText}>
            {strings('account_backup_step_1.what_is_seedphrase_text_2')}
          </Text>
          <Text style={styles.explanationText}>
            {strings('account_backup_step_1.what_is_seedphrase_text_3')}
          </Text>
        </View>
      </View>
    </ActionModal>
  );
};

export default SeedphraseModal;
