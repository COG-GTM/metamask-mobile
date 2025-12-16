import React, { PureComponent } from 'react';
import {
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  View,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { fontStyles } from '../../../styles/common';
import { connect } from 'react-redux';
import QRCode from 'react-native-qrcode-svg';
import { strings } from '../../../../locales/i18n';
import IonicIcon from 'react-native-vector-icons/Ionicons';
import Device from '../../../util/device';
import { showAlert } from '../../../actions/alert';
import GlobalAlert from '../../UI/GlobalAlert';
import { protectWalletModalVisible } from '../../../actions/user';
import ClipboardManager from '../../../core/ClipboardManager';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { selectSelectedInternalAccountFormattedAddress } from '../../../selectors/accountsController';
import { RootState } from '../../../reducers';
import { Theme } from '../../../util/theme/models';

const WIDTH = Dimensions.get('window').width - 88;

interface Styles {
  root: ViewStyle;
  wrapper: ViewStyle;
  qrCodeContainer: ViewStyle;
  qrCode: ViewStyle;
  addressWrapper: ViewStyle;
  closeIcon: ViewStyle;
  addressTitle: TextStyle;
  address: TextStyle;
}

const createStyles = (theme: Theme): Styles =>
  StyleSheet.create({
    root: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Device.isSmallDevice() ? -30 : -50,
    },
    wrapper: {
      flex: 1,
      alignItems: 'center',
    },
    qrCodeContainer: {
      marginBottom: 16,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 28,
      backgroundColor: theme.colors.background.default,
      borderRadius: 8,
    },
    qrCode: {
      padding: 8,
      backgroundColor: theme.brandColors.white,
    },
    addressWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      width: WIDTH,
      borderRadius: 8,
      backgroundColor: theme.colors.background.default,
      paddingVertical: 12,
    },
    closeIcon: {
      width: WIDTH + 40,
      paddingBottom: Device.isSmallDevice() ? 30 : 50,
      flexDirection: 'row-reverse',
    },
    addressTitle: {
      fontSize: 16,
      paddingHorizontal: 28,
      paddingVertical: 4,
      ...fontStyles.normal,
      color: theme.colors.text.default,
    },
    address: {
      ...fontStyles.normal,
      paddingHorizontal: 28,
      paddingVertical: 4,
      fontSize: 16,
      textAlign: 'center',
      color: theme.colors.text.default,
    },
  });

interface AlertConfig {
  isVisible: boolean;
  autodismiss: number;
  content: string;
  data: { msg: string };
}

interface AddressQRCodeProps {
  selectedAddress: string;
  showAlert: (config: AlertConfig) => void;
  closeQrModal: () => void;
  protectWalletModalVisible: () => void;
  seedphraseBackedUp: boolean;
}

/**
 * PureComponent that renders a public address view
 */
class AddressQRCode extends PureComponent<AddressQRCodeProps> {
  declare context: React.ContextType<typeof ThemeContext>;

  /**
   * Closes QR code modal
   */
  closeQrModal = () => {
    this.props.closeQrModal();
    !this.props.seedphraseBackedUp &&
      setTimeout(() => this.props.protectWalletModalVisible(), 1000);
  };

  copyAccountToClipboard = async () => {
    const { selectedAddress } = this.props;
    await ClipboardManager.setString(selectedAddress);
    this.props.showAlert({
      isVisible: true,
      autodismiss: 1500,
      content: 'clipboard-alert',
      data: { msg: strings('account_details.account_copied_to_clipboard') },
    });
  };

  processAddress = (): string => {
    const { selectedAddress } = this.props;
    const matches = selectedAddress.slice(2).match(/.{1,4}/g);
    const processedAddress = `${selectedAddress.slice(0, 2)} ${matches ? matches.join(' ') : ''}`;
    return processedAddress;
  };

  render() {
    const theme = this.context || mockTheme;
    const colors = theme.colors;
    const styles = createStyles(theme);

    return (
      <View style={styles.root}>
        <View style={styles.wrapper}>
          <TouchableOpacity
            style={styles.closeIcon}
            onPress={this.closeQrModal}
          >
            <IonicIcon
              name={'close'}
              size={38}
              color={colors.primary.inverse}
            />
          </TouchableOpacity>
          <View style={styles.qrCodeContainer}>
            <View style={styles.qrCode}>
              <QRCode
                value={`ethereum:${this.props.selectedAddress}`}
                size={Dimensions.get('window').width - 160}
              />
            </View>
          </View>
          <View style={styles.addressWrapper}>
            <Text style={styles.addressTitle}>
              {strings('receive_request.public_address_qr_code')}
            </Text>
            <TouchableOpacity onPress={this.copyAccountToClipboard}>
              <Text style={styles.address}>{this.processAddress()}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <GlobalAlert />
      </View>
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
  seedphraseBackedUp: state.user.seedphraseBackedUp,
});

const mapDispatchToProps = (dispatch: (action: unknown) => void) => ({
  showAlert: (config: AlertConfig) => dispatch(showAlert(config)),
  protectWalletModalVisible: () => dispatch(protectWalletModalVisible()),
});

AddressQRCode.contextType = ThemeContext;

export default connect(mapStateToProps, mapDispatchToProps)(AddressQRCode);
