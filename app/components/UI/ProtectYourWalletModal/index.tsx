import React, { PureComponent } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import ActionModal from '../ActionModal';
import { fontStyles } from '../../../styles/common';
import { connect } from 'react-redux';
import { protectWalletModalNotVisible } from '../../../actions/user';
import Icon from 'react-native-vector-icons/FontAwesome';
import { strings } from '../../../../locales/i18n';
import scaling from '../../../util/scaling';
import { MetaMetricsEvents } from '../../../core/Analytics';

import { ThemeContext, mockTheme } from '../../../util/theme';
import { ProtectWalletModalSelectorsIDs } from '../../../../e2e/selectors/Onboarding/ProtectWalletModal.selectors';
import { withMetricsAwareness } from '../../../components/hooks/useMetrics';
import { Theme } from '../../../util/theme/models';
import { RootState } from '../../../reducers';

const protectWalletImage = require('../../../images/explain-backup-seedphrase.png'); // eslint-disable-line

interface Styles {
  wrapper: ViewStyle;
  title: TextStyle;
  imageWrapper: ViewStyle;
  image: ImageStyle;
  text: TextStyle;
  closeIcon: ViewStyle;
  learnMoreText: TextStyle;
  modalXIcon: TextStyle;
  titleWrapper: ViewStyle;
  auxCenter: ViewStyle;
}

const createStyles = (colors: Theme['colors']): Styles =>
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

interface NavigationProp {
  navigate: (route: string, params?: Record<string, unknown>) => void;
  pop: () => void;
}

interface MetricsProp {
  trackEvent: (event: unknown) => void;
  createEventBuilder: (event: unknown) => {
    addProperties: (props: Record<string, unknown>) => {
      build: () => unknown;
    };
  };
}

interface ProtectYourWalletModalProps {
  navigation: NavigationProp;
  protectWalletModalNotVisible: () => void;
  protectWalletModalVisible: boolean;
  passwordSet: boolean;
  metrics: MetricsProp;
}

class ProtectYourWalletModal extends PureComponent<ProtectYourWalletModalProps> {
  static contextType = ThemeContext;
  declare context: React.ContextType<typeof ThemeContext>;

  goToBackupFlow = () => {
    this.props.protectWalletModalNotVisible();
    this.props.navigation.navigate(
      'SetPasswordFlow',
      this.props.passwordSet ? { screen: 'AccountBackupStep1' } : undefined,
    );
    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.WALLET_SECURITY_PROTECT_ENGAGED)
        .addProperties({
          wallet_protection_required: false,
          source: 'Modal',
        })
        .build(),
    );
  };

  onLearnMore = () => {
    this.props.protectWalletModalNotVisible();
    this.props.navigation.navigate('Webview', {
      screen: 'SimpleWebview',
      params: {
        url: 'https://support.metamask.io/privacy-and-security/basic-safety-and-security-tips-for-metamask/',
        title: strings('protect_wallet_modal.title'),
      },
    });
  };

  onDismiss = () => {
    this.props.protectWalletModalNotVisible();
    this.props.metrics.trackEvent(
      this.props.metrics
        .createEventBuilder(MetaMetricsEvents.WALLET_SECURITY_PROTECT_DISMISSED)
        .addProperties({
          wallet_protection_required: false,
          source: 'Modal',
        })
        .build(),
    );
  };

  render() {
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <ActionModal
        modalVisible={this.props.protectWalletModalVisible}
        cancelText={strings('protect_wallet_modal.top_button')}
        confirmText={strings('protect_wallet_modal.bottom_button')}
        onCancelPress={this.goToBackupFlow}
        onRequestClose={this.onDismiss}
        onConfirmPress={this.onDismiss}
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
              onPress={this.onDismiss}
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

          <TouchableOpacity onPress={this.onLearnMore}>
            <Text style={styles.learnMoreText}>
              {strings('protect_wallet_modal.action')}
            </Text>
          </TouchableOpacity>
        </View>
      </ActionModal>
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  protectWalletModalVisible: state.user.protectWalletModalVisible,
  passwordSet: state.user.passwordSet,
});

const mapDispatchToProps = (dispatch: (action: unknown) => void) => ({
  protectWalletModalNotVisible: () =>
    dispatch(protectWalletModalNotVisible()),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withMetricsAwareness(ProtectYourWalletModal));
