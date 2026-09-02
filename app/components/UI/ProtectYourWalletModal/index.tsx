import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { Dispatch } from 'redux';
import ActionModal from '../ActionModal';
import { fontStyles } from '../../../styles/common';
import { connect } from 'react-redux';
import { protectWalletModalNotVisible } from '../../../actions/user';
import Icon from 'react-native-vector-icons/FontAwesome';
import { strings } from '../../../../locales/i18n';
import scaling from '../../../util/scaling';
import { MetaMetricsEvents } from '../../../core/Analytics';

import { useTheme } from '../../../util/theme';
import { Colors } from '../../../util/theme/models';
import { RootState } from '../../../reducers';
import { ProtectWalletModalSelectorsIDs } from '../../../../e2e/selectors/Onboarding/ProtectWalletModal.selectors';
import { useMetrics } from '../../../components/hooks/useMetrics';

const protectWalletImage = require('../../../images/explain-backup-seedphrase.png'); // eslint-disable-line

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    wrapper: {
      marginTop: 24,
      marginHorizontal: 24,
      flex: 1,
    },
    title: {
      ...fontStyles.bold,
      color: colors.text.default,
      textAlign: 'center',
      fontSize: 20,
      flex: 1,
    },
    imageWrapper: {
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: 12,
      marginTop: 30,
    },
    image: {
      width: scaling.scale(135, { baseModel: 1 }),
      height: scaling.scale(160, { baseModel: 1 }),
    },
    text: {
      ...fontStyles.normal,
      color: colors.text.default,
      textAlign: 'center',
      fontSize: 14,
      marginBottom: 24,
    },
    closeIcon: {
      padding: 5,
    },
    learnMoreText: {
      textAlign: 'center',
      ...fontStyles.normal,
      color: colors.primary.default,
      marginBottom: 14,
      fontSize: 14,
    },
    modalXIcon: {
      fontSize: 16,
      color: colors.text.default,
    },
    titleWrapper: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    auxCenter: {
      width: 26,
    },
  });

interface OwnProps {
  navigation: NavigationProp<ParamListBase>;
}

interface StateProps {
  /**
   * Whether this modal is visible
   */
  protectWalletModalVisible: boolean;
  /**
   * Boolean that determines if the user has set a password before
   */
  passwordSet: boolean;
}

interface DispatchProps {
  /**
   * Hide this modal
   */
  protectWalletModalNotVisible: () => void;
}

type Props = OwnProps & StateProps & DispatchProps;

/**
 * View that renders an action modal
 */
const ProtectYourWalletModal = ({
  navigation,
  protectWalletModalNotVisible: hideModal,
  protectWalletModalVisible,
  passwordSet,
}: Props) => {
  const { colors } = useTheme();
  const metrics = useMetrics();
  const styles = createStyles(colors);

  const goToBackupFlow = () => {
    hideModal();
    navigation.navigate(
      'SetPasswordFlow',
      passwordSet ? { screen: 'AccountBackupStep1' } : undefined,
    );
    metrics.trackEvent(
      metrics
        .createEventBuilder(MetaMetricsEvents.WALLET_SECURITY_PROTECT_ENGAGED)
        .addProperties({
          wallet_protection_required: false,
          source: 'Modal',
        })
        .build(),
    );
  };

  const onLearnMore = () => {
    hideModal();
    navigation.navigate('Webview', {
      screen: 'SimpleWebview',
      params: {
        url: 'https://support.metamask.io/privacy-and-security/basic-safety-and-security-tips-for-metamask/',
        title: strings('protect_wallet_modal.title'),
      },
    });
  };

  const onDismiss = () => {
    hideModal();
    metrics.trackEvent(
      metrics
        .createEventBuilder(MetaMetricsEvents.WALLET_SECURITY_PROTECT_DISMISSED)
        .addProperties({
          wallet_protection_required: false,
          source: 'Modal',
        })
        .build(),
    );
  };

  return (
    <ActionModal
      modalVisible={protectWalletModalVisible}
      cancelText={strings('protect_wallet_modal.top_button')}
      confirmText={strings('protect_wallet_modal.bottom_button')}
      onCancelPress={goToBackupFlow}
      onRequestClose={onDismiss}
      onConfirmPress={onDismiss}
      cancelButtonMode={'sign'}
      confirmButtonMode={'transparent-blue'}
      verticalButtons
    >
      <View
        style={styles.wrapper}
        testID={ProtectWalletModalSelectorsIDs.CONTAINER}
      >
        <View style={styles.titleWrapper}>
          <View style={styles.auxCenter} />
          <Text style={styles.title}>
            {strings('protect_wallet_modal.title')}
          </Text>
          <TouchableOpacity
            onPress={onDismiss}
            style={styles.closeIcon}
            hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}
          >
            <Icon name="times" style={styles.modalXIcon} />
          </TouchableOpacity>
        </View>
        <View style={styles.imageWrapper}>
          <Image source={protectWalletImage} style={styles.image} />
        </View>

        <Text style={styles.text}>
          {strings('protect_wallet_modal.text')}
          <Text style={{ ...fontStyles.bold }}>
            {' ' + strings('protect_wallet_modal.text_bold')}
          </Text>
        </Text>

        <TouchableOpacity onPress={onLearnMore}>
          <Text style={styles.learnMoreText}>
            {strings('protect_wallet_modal.action')}
          </Text>
        </TouchableOpacity>
      </View>
    </ActionModal>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  protectWalletModalVisible: state.user.protectWalletModalVisible,
  passwordSet: state.user.passwordSet,
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  protectWalletModalNotVisible: () =>
    dispatch(protectWalletModalNotVisible()),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ProtectYourWalletModal);
