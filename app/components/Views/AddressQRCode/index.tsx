/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-shadow, @typescript-eslint/prefer-optional-chain, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, @typescript-eslint/prefer-for-of, import/no-namespace, import/no-named-as-default-member, react/no-unstable-nested-components */
import React, { PureComponent } from 'react';
import {
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  View,
  Text,
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

const WIDTH = Dimensions.get('window').width - 88;

// @ts-expect-error -- legacy JavaScript UI type boundary
const createStyles = (theme) =>
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

/**
 * PureComponent that renders a public address view
 */
class AddressQRCode extends PureComponent {

  /**
   * Closes QR code modal
   */
  closeQrModal = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    this.props.closeQrModal();
    // @ts-expect-error -- legacy JavaScript UI type boundary
    !this.props.seedphraseBackedUp &&
      // @ts-expect-error -- legacy JavaScript UI type boundary
      setTimeout(() => this.props.protectWalletModalVisible(), 1000);
  };

  copyAccountToClipboard = async () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { selectedAddress } = this.props;
    await ClipboardManager.setString(selectedAddress);
    // @ts-expect-error -- legacy JavaScript UI type boundary
    this.props.showAlert({
      isVisible: true,
      autodismiss: 1500,
      content: 'clipboard-alert',
      data: { msg: strings('account_details.account_copied_to_clipboard') },
    });
  };

  processAddress = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { selectedAddress } = this.props;
    const processedAddress = `${selectedAddress.slice(0, 2)} ${selectedAddress
      .slice(2)
      .match(/.{1,4}/g)
      .join(' ')}`;
    return processedAddress;
  };

  render() {
    const theme = this.context || mockTheme;
    // @ts-expect-error -- legacy JavaScript UI type boundary
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
                // @ts-expect-error -- legacy JavaScript UI type boundary
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

// @ts-expect-error -- legacy JavaScript UI type boundary
const mapStateToProps = (state) => ({
  selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
  seedphraseBackedUp: state.user.seedphraseBackedUp,
});

// @ts-expect-error -- legacy JavaScript UI type boundary
const mapDispatchToProps = (dispatch) => ({
  // @ts-expect-error -- legacy JavaScript UI type boundary
  showAlert: (config) => dispatch(showAlert(config)),
  protectWalletModalVisible: () => dispatch(protectWalletModalVisible()),
});

AddressQRCode.contextType = ThemeContext;

export default connect(mapStateToProps, mapDispatchToProps)(AddressQRCode);

interface AddressQRCodeProps {
  closeQrModal?: (...args: any[]) => any;
  protectWalletModalVisible?: (...args: any[]) => any;
  seedphraseBackedUp?: boolean;
  selectedAddress?: string;
  showAlert?: (...args: any[]) => any;
}
