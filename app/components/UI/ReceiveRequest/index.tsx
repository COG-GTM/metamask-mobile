import React from 'react';
import { SafeAreaView, Dimensions, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { connect } from 'react-redux';
import { NavigationProp, ParamListBase } from '@react-navigation/native';

import { MetaMetricsEvents } from '../../../core/Analytics';
import { strings } from '../../../../locales/i18n';
import { showAlert } from '../../../actions/alert';
import { protectWalletModalVisible } from '../../../actions/user';

import { fontStyles } from '../../../styles/common';
import GlobalAlert from '../GlobalAlert';
import StyledButton from '../StyledButton';
import { useTheme } from '../../../util/theme';
import { Theme } from '../../../util/theme/models';
import { selectChainId } from '../../../selectors/networkController';
import { isNetworkRampSupported } from '../Ramp/utils';
import { selectSelectedInternalAccountFormattedAddress } from '../../../selectors/accountsController';
import { getRampNetworks } from '../../../reducers/fiatOrders';
import { RequestPaymentModalSelectorsIDs } from '../../../../e2e/selectors/Receive/RequestPaymentModal.selectors';
import { withMetricsAwareness } from '../../../components/hooks/useMetrics';
import { IWithMetricsAwarenessProps } from '../../../components/hooks/useMetrics/withMetricsAwareness.types';
import { RootState } from '../../../reducers';
import QRAccountDisplay from '../../Views/QRAccountDisplay';
import PNG_MM_LOGO_PATH from '../../../images/branding/fox.png';

const { height: windowHeight, width: windowWidth } = Dimensions.get('window');

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: theme.colors.background.default,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      marginTop: windowHeight * 0.05 + 160,
      marginBottom: 20,
      height: windowHeight * 0.95 - 180,
    },
    body: {
      alignItems: 'center',
      paddingHorizontal: 15,
      height: '100%',
      width: '100%',
      display: 'flex',
      justifyContent: 'space-around',
    },
    qrWrapper: {
      margin: 8,
      padding: 8,
      backgroundColor: theme.brandColors.white,
    },
    addressWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      margin: 15,
      padding: 9,
      paddingHorizontal: 15,
      backgroundColor: theme.colors.background.alternative,
      borderRadius: 30,
    },
    copyButton: {
      backgroundColor: theme.colors.background.default,
      color: theme.colors.primary.default,
      borderRadius: 12,
      overflow: 'hidden',
      paddingVertical: 3,
      paddingHorizontal: 6,
      marginHorizontal: 6,
      borderWidth: 1,
      borderColor: theme.colors.primary.default,
    },
    qrCode: {
      padding: 24,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: theme.colors.background.alternative,
    },
    actionRow: {
      flexDirection: 'row',
      marginBottom: 15,
    },
    actionButton: {
      flex: 1,
      marginHorizontal: 8,
      width: '100%',
    },
    title: {
      ...fontStyles.normal,
      color: theme.colors.text.default,
      fontSize: 18,
      flexDirection: 'row',
      alignSelf: 'center',
    },
    titleWrapper: {
      marginTop: 10,
    },
  });

interface OwnProps {
  /**
   * The navigator object
   */
  navigation: NavigationProp<ParamListBase>;
  /**
   * Hides the modal that contains the component
   */
  hideModal: () => void;
}

interface StateProps {
  /**
   * Selected address as string
   */
  selectedAddress: string;
  /**
   * Asset to receive, could be not defined
   */
  receiveAsset?: unknown;
  /**
   * Network provider chain id
   */
  chainId: string;
  /**
   * redux flag that indicates if the user
   * completed the seed phrase backup flow
   */
  seedphraseBackedUp: boolean;
  /**
   * Boolean that indicates if the network supports buy
   */
  isNetworkBuySupported: boolean;
}

interface DispatchProps {
  /**
   * Triggers global alert
   */
  showAlert: (config: {
    isVisible: boolean;
    autodismiss: number;
    content: string;
    data: { msg: string };
  }) => void;
  /**
   * Prompts protect wallet modal
   */
  protectWalletModalVisible: () => void;
}

type Props = OwnProps & StateProps & DispatchProps & IWithMetricsAwarenessProps;

/**
 * Component that renders receive options
 */
const ReceiveRequest = ({
  navigation,
  selectedAddress,
  receiveAsset,
  chainId,
  metrics,
}: Props) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  const onReceive = () => {
    navigation.navigate('PaymentRequestView', {
      screen: 'PaymentRequest',
      params: { receiveAsset },
    });

    metrics.trackEvent(
      metrics
        .createEventBuilder(MetaMetricsEvents.RECEIVE_OPTIONS_PAYMENT_REQUEST)
        .build(),
    );
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.body}>
        <View style={styles.qrCode}>
          <QRCode
            logo={PNG_MM_LOGO_PATH}
            logoSize={35}
            logoMargin={5}
            value={`ethereum:${selectedAddress}@${chainId}`}
            size={windowWidth / 2}
          />
        </View>

        <QRAccountDisplay accountAddress={selectedAddress} />

        <View style={styles.actionRow}>
          <StyledButton
            type={'normal'}
            onPress={onReceive}
            containerStyle={styles.actionButton}
            testID={RequestPaymentModalSelectorsIDs.REQUEST_BUTTON}
          >
            {strings('receive_request.request_payment')}
          </StyledButton>
        </View>
      </View>

      <GlobalAlert />
    </SafeAreaView>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  chainId: selectChainId(state),
  selectedAddress: selectSelectedInternalAccountFormattedAddress(
    state,
  ) as string,
  receiveAsset: state.modals.receiveAsset,
  seedphraseBackedUp: state.user.seedphraseBackedUp,
  isNetworkBuySupported: isNetworkRampSupported(
    selectChainId(state),
    getRampNetworks(state),
  ),
});

const mapDispatchToProps = (
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: (action: any) => void,
): DispatchProps => ({
  showAlert: (config) => dispatch(showAlert(config)),
  protectWalletModalVisible: () => dispatch(protectWalletModalVisible()),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  withMetricsAwareness(
    ReceiveRequest as React.ComponentType<IWithMetricsAwarenessProps>,
  ),
);
