import React, {
  ComponentType,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { InteractionManager, TouchableOpacity, View } from 'react-native';
import { connect } from 'react-redux';
import { strings } from '../../../../locales/i18n';
import Text from '../../../component-library/components/Texts/Text';
import NotificationManager from '../../../core/NotificationManager';
import AccountInfoCard from '../AccountInfoCard';
import StyledButton from '../StyledButton';
import TransactionHeader from '../TransactionHeader';

import { MetaMetricsEvents } from '../../../core/Analytics';

import CheckBox from '@react-native-community/checkbox';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { shuffle } from 'lodash';
import URLParse from 'url-parse';
import AppConstants from '../../../../app/core/AppConstants';
import { CommonSelectorsIDs } from '../../../../e2e/selectors/Common.selectors';
import { ConnectAccountBottomSheetSelectorsIDs } from '../../../../e2e/selectors/Browser/ConnectAccountBottomSheet.selectors';
import { withMetricsAwareness } from '../../../components/hooks/useMetrics';
import Routes from '../../../constants/navigation/Routes';
import SDKConnect from '../../../core/SDKConnect/SDKConnect';
import { RootState } from '../../../reducers';
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
import { useTheme } from '../../../util/theme';
import ShowWarningBanner from './showWarningBanner';
import createStyles from './styles';
import {
  IUseMetricsHook,
  SourceType,
} from '../../hooks/useMetrics/useMetrics.types';
import { IWithMetricsAwarenessProps } from '../../hooks/useMetrics/withMetricsAwareness.types';
import { MetricsEventBuilder } from '../../../core/Analytics/MetricsEventBuilder';
import { getPhishingTestResultAsync } from '../../../util/phishingDetection';

interface CurrentPageInformation {
  title?: string;
  url?: string;
  icon?: string;
  origin?: string;
  reconnect?: boolean;
  apiVersion?: string;
  otps?: string[];
  channelId?: string;
  analytics?: {
    source?: (typeof SourceType)[keyof typeof SourceType];
    [key: string]: unknown;
  };
}

interface OwnProps {
  /**
   * Object containing current page title, url, and icon href
   */
  currentPageInformation: CurrentPageInformation;
  /**
   * Callback triggered on account access approval
   */
  onConfirm?: () => void;
  /**
   * Callback triggered on account access rejection
   */
  onCancel?: () => void;
  /**
   * navigation object required to access the props
   * passed by the parent component
   */
  navigation?: NavigationProp<ParamListBase>;
  /**
   * Whether it was a request coming through wallet connect
   */
  walletConnectRequest?: boolean;
}

interface StateProps {
  /**
   * A string that represents the selected address
   */
  selectedAddress?: string;
  /**
   * Number of tokens
   */
  tokensLength?: number;
  /**
   * Number of accounts
   */
  accountsLength?: number;
  /**
   * A string representing the network name
   */
  networkType?: string;
  /**
   * A string representing the network chainId
   */
  chainId?: string;
}

interface MetricsProps {
  /**
   * Metrics injected by withMetricsAwareness HOC
   */
  metrics: IUseMetricsHook;
}

type Props = OwnProps & StateProps & MetricsProps;

/**
 * Account access approval component
 */
const AccountApproval = (props: Props) => {
  const {
    currentPageInformation,
    onConfirm: propsOnConfirm,
    onCancel: propsOnCancel,
    selectedAddress,
    navigation,
    walletConnectRequest,
    chainId,
    accountsLength,
    metrics,
  } = props;

  const [confirmDisabled, setConfirmDisabled] = useState(true);
  const [otpChoice, setOtpChoice] = useState<string | undefined>(undefined);
  const [noPersist, setNoPersist] = useState(false);
  const [otps] = useState<string[]>(() =>
    shuffle(currentPageInformation.otps || []),
  );
  const [otp] = useState<boolean>(() =>
    Boolean(
      currentPageInformation.origin ===
        AppConstants.DEEPLINKS.ORIGIN_QR_CODE &&
        currentPageInformation.reconnect &&
        currentPageInformation.apiVersion,
    ),
  );
  const [isUrlFlaggedAsPhishing, setIsUrlFlaggedAsPhishing] = useState(false);

  const isMountedRef = useRef(false);

  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);

  const getAnalyticsParams = useCallback(() => {
    let urlHostName = 'N/A';

    try {
      if (currentPageInformation?.url) {
        const url = new URLParse(currentPageInformation.url);
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

      return walletConnectRequest ? SourceType.WALLET_CONNECT : SourceType.SDK;
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
  }, [
    accountsLength,
    chainId,
    currentPageInformation,
    selectedAddress,
    walletConnectRequest,
  ]);

  useEffect(() => {
    isMountedRef.current = true;

    const checkUrlFlaggedAsPhishing = async (hostname: string) => {
      const scanResult = await getPhishingTestResultAsync(hostname);
      if (isMountedRef.current) {
        setIsUrlFlaggedAsPhishing(scanResult.result);
      }
    };

    const prefixedUrl = prefixUrlWithProtocol(
      currentPageInformation?.url ?? '',
    );
    const { hostname } = new URLParse(prefixedUrl);
    checkUrlFlaggedAsPhishing(hostname);

    metrics.trackEvent(
      MetricsEventBuilder.createEventBuilder(
        MetaMetricsEvents.CONNECT_REQUEST_STARTED,
      )
        .addProperties(getAnalyticsParams())
        .build(),
    );

    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showWalletConnectNotification = (confirmation = false) => {
    if (walletConnectRequest) {
      const title = currentPageInformation.title;
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
  const onConfirm = () => {
    if (otp && otpChoice !== currentPageInformation.otps?.[0]) {
      if (currentPageInformation.channelId) {
        SDKConnect.getInstance().removeChannel({
          channelId: currentPageInformation.channelId,
          sendTerminate: true,
        });
      }
      // onConfirm will close current window by rejecting current approvalRequest.
      propsOnCancel?.();

      metrics.trackEvent(
        MetricsEventBuilder.createEventBuilder(
          MetaMetricsEvents.CONNECT_REQUEST_OTPFAILURE,
        )
          .addProperties(getAnalyticsParams())
          .build(),
      );

      // Navigate to feedback modal
      navigation?.navigate(Routes.MODAL.ROOT_MODAL_FLOW, {
        screen: Routes.SHEET.SDK_FEEDBACK,
      });

      return;
    }

    if (noPersist && currentPageInformation.channelId) {
      SDKConnect.getInstance().invalidateChannel({
        channelId: currentPageInformation.channelId,
      });
    }

    propsOnConfirm?.();
    metrics.trackEvent(
      MetricsEventBuilder.createEventBuilder(
        MetaMetricsEvents.CONNECT_REQUEST_COMPLETED,
      )
        .addProperties(getAnalyticsParams())
        .build(),
    );
    showWalletConnectNotification(true);
  };

  /**
   * Calls onCancel callback and analytics to track connect canceled event
   */
  const onCancel = () => {
    metrics.trackEvent(
      MetricsEventBuilder.createEventBuilder(
        MetaMetricsEvents.CONNECT_REQUEST_CANCELLED,
      )
        .addProperties(getAnalyticsParams())
        .build(),
    );
    if (currentPageInformation.channelId) {
      SDKConnect.getInstance().removeChannel({
        channelId: currentPageInformation.channelId,
        sendTerminate: true,
      });
    }

    propsOnCancel?.();
    showWalletConnectNotification();
  };

  const onOTP = (value: string) => {
    setOtpChoice(value);
    setConfirmDisabled(false);
  };

  const hasRememberMe =
    !currentPageInformation.reconnect &&
    currentPageInformation.origin === AppConstants.DEEPLINKS.ORIGIN_QR_CODE;

  return (
    <View
      style={styles.root}
      testID={ConnectAccountBottomSheetSelectorsIDs.CONTAINER}
    >
      <TransactionHeader currentPageInformation={currentPageInformation} />

      {isUrlFlaggedAsPhishing && <ShowWarningBanner />}

      {!currentPageInformation.reconnect && (
        <>
          <Text style={styles.intro}>{strings('accountApproval.action')}</Text>
          <Text style={styles.warning}>
            {strings('accountApproval.warning')}
          </Text>
        </>
      )}
      <View style={styles.accountCardWrapper}>
        <AccountInfoCard fromAddress={selectedAddress as string} />
      </View>
      {currentPageInformation.reconnect && (
        <Text style={styles.intro_reconnect}>
          {otp
            ? strings('accountApproval.action_reconnect')
            : strings('accountApproval.action_reconnect_deeplink')}
        </Text>
      )}
      {otp && (
        <View style={styles.otpContainer}>
          {otps.map((otpValue, index) => (
            <TouchableOpacity
              key={`otp${index}`}
              style={[
                styles.touchableOption,
                otpChoice === otpValue && styles.selectedOption,
              ]}
              onPress={() => onOTP(otpValue)}
            >
              <View
                style={
                  otpChoice === otpValue ? styles.selectedCircle : styles.circle
                }
              />
              <Text style={styles.optionText}>{otpValue}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {hasRememberMe && (
        <View style={styles.rememberme}>
          <CheckBox
            style={styles.rememberCheckbox}
            value={noPersist}
            onValueChange={(checked: boolean) => {
              setNoPersist(checked);
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
          onPress={onCancel}
          containerStyle={[styles.button, styles.cancel]}
          testID={CommonSelectorsIDs.CANCEL_BUTTON}
        >
          {currentPageInformation.reconnect
            ? strings('accountApproval.disconnect')
            : strings('accountApproval.cancel')}
        </StyledButton>
        <StyledButton
          disabled={otp && confirmDisabled}
          type={'confirm'}
          onPress={onConfirm}
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

const mapStateToProps = (state: RootState): StateProps => ({
  accountsLength: selectAccountsLength(state),
  tokensLength: selectTokensLength(state),
  selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
  networkType: selectProviderType(state),
  chainId: selectEvmChainId(state),
});

export default connect(mapStateToProps)(
  withMetricsAwareness(
    AccountApproval as ComponentType<IWithMetricsAwarenessProps>,
  ),
);
