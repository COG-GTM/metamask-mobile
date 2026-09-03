import React, { PureComponent } from 'react';
import {
  InteractionManager,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { connect } from 'react-redux';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import type { Theme } from '@metamask/design-tokens';
import { strings } from '../../../../locales/i18n';
import Text from '../../../component-library/components/Texts/Text';
import NotificationManager from '../../../core/NotificationManager';
import AccountInfoCard from '../AccountInfoCard';
import StyledButton from '../StyledButton';
import TransactionHeader from '../TransactionHeader';

import { MetaMetricsEvents } from '../../../core/Analytics';

import CheckBox from '@react-native-community/checkbox';
import { shuffle } from 'lodash';
import URLParser from 'url-parse';
import AppConstants from '../../../../app/core/AppConstants';
import { CommonSelectorsIDs } from '../../../../e2e/selectors/Common.selectors';
import { ConnectAccountBottomSheetSelectorsIDs } from '../../../../e2e/selectors/Browser/ConnectAccountBottomSheet.selectors';
import { withMetricsAwareness } from '../../../components/hooks/useMetrics';
import Routes from '../../../constants/navigation/Routes';
import SDKConnect from '../../../core/SDKConnect/SDKConnect';
import { selectAccountsLength } from '../../../selectors/accountTrackerController';
import { selectSelectedInternalAccountFormattedAddress } from '../../../selectors/accountsController';
import {
  selectEvmChainId,
  selectProviderType,
} from '../../../selectors/networkController';
import { selectTokensLength } from '../../../selectors/tokensController';
import { getAddressAccountType } from '../../../util/address';
import { prefixUrlWithProtocol } from '../../../util/browser';
import { getDecimalChainId } from '../../../util/networks';
import { ThemeContext, mockTheme } from '../../../util/theme';
import ShowWarningBanner from './showWarningBanner';
import createStyles from './styles';
import { SourceType } from '../../hooks/useMetrics/useMetrics.types';
import { MetricsEventBuilder } from '../../../core/Analytics/MetricsEventBuilder';
import { getPhishingTestResultAsync } from '../../../util/phishingDetection';
import type { RootState } from '../../../reducers';
import type { IWithMetricsAwarenessProps } from '../../hooks/useMetrics/withMetricsAwareness.types';
/**
 * Account access approval component
 */
interface CurrentPageInformation {
  url?: string;
  title?: string;
  icon?: string;
  origin?: string;
  reconnect?: boolean;
  apiVersion?: string;
  otps?: number[];
  channelId?: string;
  analytics?: { source?: string; [key: string]: unknown };
}

interface OwnProps {
  currentPageInformation: CurrentPageInformation;
  onConfirm: () => void;
  onCancel: () => void;
  navigation?: NavigationProp<ParamListBase>;
  walletConnectRequest?: boolean;
}

interface StateProps {
  selectedAddress: ReturnType<
    typeof selectSelectedInternalAccountFormattedAddress
  >;
  tokensLength: number;
  accountsLength: number;
  networkType: ReturnType<typeof selectProviderType>;
  chainId: ReturnType<typeof selectEvmChainId>;
}

type Props = OwnProps & StateProps & IWithMetricsAwarenessProps;

interface State {
  start: number;
  confirmDisabled: boolean;
  otpChoice?: number;
  noPersist: boolean;
  otps: number[];
  otp: string | boolean | undefined;
  isUrlFlaggedAsPhishing: boolean;
}

class AccountApproval extends PureComponent<Props, State> {
  private _isMounted = false;

  state: State = {
    start: Date.now(),
    confirmDisabled: true,
    otpChoice: undefined,
    noPersist: false,
    otps: shuffle(this.props.currentPageInformation.otps || []),
    otp:
      this.props.currentPageInformation.origin ===
        AppConstants.DEEPLINKS.ORIGIN_QR_CODE &&
      this.props.currentPageInformation.reconnect &&
      this.props.currentPageInformation.apiVersion,
    isUrlFlaggedAsPhishing: false,
  };

  getAnalyticsParams = () => {
    const { currentPageInformation, chainId, selectedAddress, accountsLength } =
      this.props;
    let urlHostName = 'N/A';

    try {
      if (currentPageInformation?.url) {
        const url = new URLParser(currentPageInformation.url);
        urlHostName = url.host;
      }
    } catch (error) {
      console.error('URL conversion error:', error);
    }

    const getSource = () => {
      const source = currentPageInformation?.analytics?.source;

      if (source) {
        return source;
      }

      if (
        currentPageInformation?.analytics &&
        'source' in currentPageInformation.analytics &&
        !source
      ) {
        return SourceType.DAPP_DEEPLINK_URL;
      }

      return this.props.walletConnectRequest
        ? SourceType.WALLET_CONNECT
        : SourceType.SDK;
    };

    const extraAnalyticsParams = {
      ...currentPageInformation?.analytics,
      source: getSource(),
    };

    return {
      account_type: selectedAddress
        ? getAddressAccountType(selectedAddress)
        : null,
      dapp_host_name: urlHostName,
      chain_id: chainId ? getDecimalChainId(chainId) : null,
      number_of_accounts: accountsLength,
      number_of_accounts_connected: 1,
      ...extraAnalyticsParams,
    };
  };

  componentDidMount = () => {
    this._isMounted = true;

    const { currentPageInformation } = this.props;

    const prefixedUrl = prefixUrlWithProtocol(
      currentPageInformation?.url ?? '',
    );
    const { hostname } = new URLParser(prefixedUrl);
    this.checkUrlFlaggedAsPhishing(hostname);

    this.props.metrics.trackEvent(
      MetricsEventBuilder.createEventBuilder(
        MetaMetricsEvents.CONNECT_REQUEST_STARTED,
      )
        .addProperties(this.getAnalyticsParams())
        .build(),
    );
  };

  componentWillUnmount = () => {
    this._isMounted = false;
  };

  showWalletConnectNotification = (confirmation = false) => {
    if (this.props.walletConnectRequest) {
      const title = this.props.currentPageInformation.title;
      InteractionManager.runAfterInteractions(() => {
        NotificationManager.showSimpleNotification({
          status: `simple_notification${!confirmation ? '_rejected' : ''}`,
          duration: 5000,
          title: confirmation
            ? strings('notifications.wc_connected_title', { title })
            : strings('notifications.wc_connected_rejected_title'),
          description: strings('notifications.wc_description'),
        });
      });
    }
  };

  /**
   * Calls onConfirm callback and analytics to track connect confirmed event
   */
  onConfirm = () => {
    if (
      this.state.otp &&
      this.state.otpChoice !== this.props.currentPageInformation.otps?.[0]
    ) {
      if (this.props.currentPageInformation.channelId) {
        SDKConnect.getInstance().removeChannel({
          channelId: this.props.currentPageInformation.channelId,
          sendTerminate: true,
        });
      }
      // onConfirm will close current window by rejecting current approvalRequest.
      this.props.onCancel();

      this.props.metrics.trackEvent(
        MetricsEventBuilder.createEventBuilder(
          MetaMetricsEvents.CONNECT_REQUEST_OTPFAILURE,
        )
          .addProperties(this.getAnalyticsParams())
          .build(),
      );

      // Navigate to feedback modal
      const { navigation } = this.props;
      navigation?.navigate(Routes.MODAL.ROOT_MODAL_FLOW, {
        screen: Routes.SHEET.SDK_FEEDBACK,
      });

      return;
    }

    if (this.state.noPersist) {
      if (this.props.currentPageInformation.channelId) {
        SDKConnect.getInstance().invalidateChannel({
          channelId: this.props.currentPageInformation.channelId,
        });
      }
    }

    this.props.onConfirm();
    this.props.metrics.trackEvent(
      MetricsEventBuilder.createEventBuilder(
        MetaMetricsEvents.CONNECT_REQUEST_COMPLETED,
      )
        .addProperties(this.getAnalyticsParams())
        .build(),
    );
    this.showWalletConnectNotification(true);
  };

  /**
   * Calls onConfirm callback and analytics to track connect canceled event
   */
  onCancel = () => {
    this.props.metrics.trackEvent(
      MetricsEventBuilder.createEventBuilder(
        MetaMetricsEvents.CONNECT_REQUEST_CANCELLED,
      )
        .addProperties(this.getAnalyticsParams())
        .build(),
    );
    if (this.props.currentPageInformation.channelId) {
      SDKConnect.getInstance().removeChannel({
        channelId: this.props.currentPageInformation.channelId,
        sendTerminate: true,
      });
    }

    this.props.onCancel();
    this.showWalletConnectNotification();
  };

  /**
   * Returns corresponding tracking params to send
   *
   * @return {object} - Object containing numberOfTokens, numberOfAccounts, network and timeOpen
   */
  getTrackingParams = () => {
    const {
      tokensLength,
      accountsLength,
      networkType,
      currentPageInformation: { url },
    } = this.props;
    return {
      view: url,
      numberOfTokens: tokensLength,
      numberOfAccounts: accountsLength,
      network: networkType,
      timeOpen: (Date.now() - this.state.start) / 1000,
    };
  };

  onOTP = (value: number) => {
    this.setState({
      otpChoice: value,
      confirmDisabled: false,
    });
  };

  checkUrlFlaggedAsPhishing = async (hostname: string) => {
    const scanResult = await getPhishingTestResultAsync(hostname);
    if (this._isMounted) {
      this.setState({
        isUrlFlaggedAsPhishing: scanResult.result,
      });
    }
  };

  render = () => {
    const { currentPageInformation, selectedAddress } = this.props;
    const { isUrlFlaggedAsPhishing } = this.state;
    const { colors, typography } =
      (this.context as unknown as Theme) || mockTheme;
    const styles = createStyles(colors, typography);
    const hasRememberMe =
      !currentPageInformation.reconnect &&
      this.props.currentPageInformation.origin ===
        AppConstants.DEEPLINKS.ORIGIN_QR_CODE;

    return (
      <View
        style={styles.root}
        testID={ConnectAccountBottomSheetSelectorsIDs.CONTAINER}
      >
        <TransactionHeader currentPageInformation={currentPageInformation} />

        {isUrlFlaggedAsPhishing && <ShowWarningBanner />}

        {!currentPageInformation.reconnect && (
          <>
            <Text style={styles.intro as StyleProp<TextStyle>}>
              {strings('accountApproval.action')}
            </Text>
            <Text style={styles.warning as StyleProp<TextStyle>}>
              {strings('accountApproval.warning')}
            </Text>
          </>
        )}
        <View style={styles.accountCardWrapper}>
          <AccountInfoCard fromAddress={selectedAddress ?? ''} />
        </View>
        {currentPageInformation.reconnect && (
          <Text style={styles.intro_reconnect as StyleProp<TextStyle>}>
            {this.state.otp
              ? strings('accountApproval.action_reconnect')
              : strings('accountApproval.action_reconnect_deeplink')}
          </Text>
        )}
        {this.state.otp && (
          <View style={styles.otpContainer}>
            {this.state.otps.map((otpValue, index) => (
              <TouchableOpacity
                key={`otp${index}`}
                style={[
                  styles.touchableOption,
                  this.state.otpChoice === otpValue && styles.selectedOption,
                ]}
                onPress={() => this.onOTP(otpValue)}
              >
                <View
                  style={
                    this.state.otpChoice === otpValue
                      ? styles.selectedCircle
                      : styles.circle
                  }
                />
                <Text style={styles.optionText as StyleProp<TextStyle>}>
                  {otpValue}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {hasRememberMe && (
          <View style={styles.rememberme}>
            <CheckBox
              style={styles.rememberCheckbox}
              value={this.state.noPersist}
              onValueChange={(checked: boolean) => {
                this.setState({ noPersist: checked });
              }}
              boxType={'square'}
              tintColors={{
                true: colors.primary.default,
                false: colors.border.default,
              }}
            />
            <Text style={styles.rememberText}>
              {strings('accountApproval.donot_rememberme')}
            </Text>
          </View>
        )}
        <View style={styles.actionContainer}>
          <StyledButton
            type={'cancel'}
            onPress={this.onCancel}
            containerStyle={[styles.button, styles.cancel]}
            testID={CommonSelectorsIDs.CANCEL_BUTTON}
          >
            {currentPageInformation.reconnect
              ? strings('accountApproval.disconnect')
              : strings('accountApproval.cancel')}
          </StyledButton>
          <StyledButton
            disabled={!!this.state.otp && this.state.confirmDisabled}
            type={'confirm'}
            onPress={this.onConfirm}
            containerStyle={[
              styles.button,
              styles.confirm,
              isUrlFlaggedAsPhishing && styles.warningButton,
            ]}
            testID={CommonSelectorsIDs.CONNECT_BUTTON}
          >
            {currentPageInformation.reconnect
              ? strings('accountApproval.resume')
              : strings('accountApproval.connect')}
          </StyledButton>
        </View>
      </View>
    );
  };
}

const mapStateToProps = (state: RootState): StateProps => ({
  accountsLength: selectAccountsLength(state),
  tokensLength: selectTokensLength(state),
  selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
  networkType: selectProviderType(state),
  chainId: selectEvmChainId(state),
});

AccountApproval.contextType = ThemeContext;

export default connect(mapStateToProps)(withMetricsAwareness(AccountApproval));
