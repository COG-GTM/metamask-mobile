/* eslint-disable react/display-name */
import React from 'react';
import NavbarTitle from '../NavbarTitle';
import ModalNavbarTitle from '../ModalNavbarTitle';
import AccountRightButton from '../AccountRightButton';
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ImageSourcePropType,
  ColorValue,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors as importedColors, fontStyles } from '../../../styles/common';
import IonicIcon from 'react-native-vector-icons/Ionicons';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { scale } from 'react-native-size-matters';
import { strings } from '../../../../locales/i18n';
import AppConstants from '../../../core/AppConstants';
import DeeplinkManager from '../../../core/DeeplinkManager/SharedDeeplinkManager';
import { MetaMetrics, MetaMetricsEvents } from '../../../core/Analytics';
import {
  importAccountFromPrivateKey,
  getLabelTextByAddress,
} from '../../../util/address';
import { isNotificationsFeatureEnabled } from '../../../util/notifications';
import Device from '../../../util/device';
import generateTestId from '../../../../wdio/utils/generateTestId';
import PickerNetwork from '../../../component-library/components/Pickers/PickerNetwork';
import { NAV_ANDROID_BACK_BUTTON } from '../../../../wdio/screen-objects/testIDs/Screens/NetworksScreen.testids';
import { BACK_BUTTON_SIMPLE_WEBVIEW } from '../../../../wdio/screen-objects/testIDs/Components/SimpleWebView.testIds';
import Routes from '../../../constants/navigation/Routes';

import ButtonIcon, {
  ButtonIconSizes,
} from '../../../component-library/components/Buttons/ButtonIcon';

import {
  default as MorphText,
  TextVariant,
} from '../../../component-library/components/Texts/Text';
import { CommonSelectorsIDs } from '../../../../e2e/selectors/Common.selectors';
import { WalletViewSelectorsIDs } from '../../../../e2e/selectors/wallet/WalletView.selectors';
import { NetworksViewSelectorsIDs } from '../../../../e2e/selectors/Settings/NetworksView.selectors';
import { SendLinkViewSelectorsIDs } from '../../../../e2e/selectors/Receive/SendLinkView.selectors';
import { SendViewSelectorsIDs } from '../../../../e2e/selectors/SendFlow/SendView.selectors';
import { getBlockaidTransactionMetricsParams } from '../../../util/blockaid';
import Icon, {
  IconName,
  IconSize,
  IconColor,
} from '../../../component-library/components/Icons/Icon';
import { AddContactViewSelectorsIDs } from '../../../../e2e/selectors/Settings/Contacts/AddContactView.selectors';
import HeaderBase from '../../../component-library/components/HeaderBase';
import AddressCopy from '../AddressCopy';
import PickerAccount from '../../../component-library/components/Pickers/PickerAccount';
import { createAccountSelectorNavDetails } from '../../../components/Views/AccountSelector';
import { RequestPaymentViewSelectors } from '../../../../e2e/selectors/Receive/RequestPaymentView.selectors';
import { MetricsEventBuilder } from '../../../core/Analytics/MetricsEventBuilder';
import { toChecksumHexAddress } from '@metamask/controller-utils';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { getFormattedAddressFromInternalAccount } from '../../../core/Multichain/utils';

///: END:ONLY_INCLUDE_IF
import { withMetaMetrics } from '../Stake/utils/metaMetrics/withMetaMetrics';
import { BridgeViewMode } from '../Bridge/types';
import { Colors } from '../../../util/theme/models';
import {
  ITrackingEvent,
  IMetaMetricsEvent,
} from '../../../core/Analytics/MetaMetrics.types';
import { InternalAccount } from '@metamask/keyring-internal-api';

/**
 * These helpers are called from screens whose navigation and route objects have
 * many different types, so they accept the structural minimum and narrow to the
 * members they actually use.
 */
type NavbarNavigation = object;

interface NavbarRoute {
  name?: string;
  params?: object;
}

interface NavigationActions {
  pop: (count?: number) => void;
  goBack: () => void;
  navigate: (...args: never[]) => void;
  dangerouslyGetParent: () => { pop: (count?: number) => void } | undefined;
}

interface NavbarRouteParams {
  dispatch?: () => void;
  editMode?: string;
  mode?: string;
  disableModeChange?: boolean;
  providerType?: string;
  isPaymentRequest?: boolean;
  headerLeft?: () => React.ReactNode;
  title?: string;
  leftAction?: string;
  requestedTrade?: Record<string, string | number | undefined>;
  selectedQuote?: string;
  quoteBegin?: number;
  bridgeViewMode?: BridgeViewMode;
}

interface MetricsOption {
  event: IMetaMetricsEvent;
  properties: Record<string, string>;
}

/**
 * `NavbarTitle` is a JavaScript component whose props are not declared, so its
 * long-standing props are described here for the call sites below.
 */
const NavbarTitleView = NavbarTitle as unknown as React.ComponentType<{
  title?: string | null;
  disableNetwork?: boolean;
  showSelectedNetwork?: boolean;
  translate?: boolean;
  networkName?: string;
  children?: React.ReactNode;
}>;

const asNavigation = (navigation: NavbarNavigation) =>
  navigation as NavigationActions;

const routeParams = (route: NavbarRoute) =>
  route.params as NavbarRouteParams | undefined;

const trackEvent = (event: ITrackingEvent) => {
  MetaMetrics.getInstance().trackEvent(event);
};

const styles = StyleSheet.create({
  metamaskName: {
    width: 70,
    height: 35,
  },
  metamaskFox: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  backIconIOS: {
    marginHorizontal: 4,
    marginTop: -4,
  },
  shareIconIOS: {
    marginHorizontal: -5,
  },
  hamburgerButton: {
    paddingLeft: Device.isAndroid() ? 22 : 18,
    paddingRight: Device.isAndroid() ? 22 : 18,
    paddingTop: Device.isAndroid() ? 14 : 10,
    paddingBottom: Device.isAndroid() ? 14 : 10,
  },
  backButton: {
    paddingLeft: Device.isAndroid() ? 22 : 18,
    paddingRight: Device.isAndroid() ? 22 : 18,
    marginTop: 5,
  },
  closeButton: {
    paddingHorizontal: Device.isAndroid() ? 22 : 18,
    paddingVertical: Device.isAndroid() ? 14 : 8,
  },
  disabled: {
    opacity: 0.3,
  },
  rightElementContainer: {
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  optinHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Device.isIos() ? 20 : 0,
  },
  metamaskNameTransparentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  metamaskNameWrapper: {
    marginLeft: Device.isAndroid() ? 20 : 0,
  },
  leftElementContainer: {
    marginLeft: 16,
  },
  notificationsBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,

    position: 'absolute',
    top: 2,
    right: 4,
  },
  headerLeftButton: {
    marginHorizontal: 16,
  },
  headerRightButton: {
    marginHorizontal: 16,
  },
  addressCopyWrapper: {
    marginHorizontal: 4,
  },
  iconButton: {
    marginHorizontal: 24,
  },
});

const metamask_name = require('../../../images/branding/metamask-name.png'); // eslint-disable-line
const metamask_fox = require('../../../images/branding/fox.png'); // eslint-disable-line
/**
 * Function that returns the navigation options
 * This is used by views that will show our custom navbar
 * which contains accounts icon, Title or MetaMask Logo and current network, and settings icon
 *
 * @param {string} title - Title in string format
 * @param {Object} navigation - Navigation object required to push new views
 * @param {bool} disableNetwork - Boolean that specifies if the network can be changed, defaults to false
 * @returns {Object} - Corresponding navbar options containing headerTitle, headerLeft, headerTruncatedBackTitle and headerRight
 */
export function getTransactionsNavbarOptions(
  title: string,
  themeColors: Colors,
  _: unknown,
  selectedAddress: string,
  handleRightButtonPress: () => void,
) {
  const innerStyles = StyleSheet.create({
    headerStyle: {
      backgroundColor: themeColors.background.default,
      shadowColor: importedColors.transparent,
      elevation: 0,
    },
    headerIcon: {
      color: themeColors.primary.default,
    },
    headerButtonText: {
      color: themeColors.primary.default,
      fontSize: 14,
      ...fontStyles.normal,
    },
  });

  return {
    headerTitle: () => <NavbarTitleView title={title} />,
    headerLeft: null,
    headerRight: () => (
      <AccountRightButton
        selectedAddress={selectedAddress}
        onPress={handleRightButtonPress}
      />
    ),
    headerStyle: innerStyles.headerStyle,
    headerTintColor: themeColors.primary.default,
  };
}

/**
 * Function that returns the navigation options
 * This is used by views that will show our custom navbar which contains Title
 *
 * @param {string} title - Title in string format
 * @param {Object} navigation - Navigation object required to push new views
 * @param isFullScreenModal
 * @param themeColors
 * @param {IMetaMetricsEvent} navigationPopEvent
 * @returns {Object} - Corresponding navbar options containing title and headerTitleStyle
 */
export function getNavigationOptionsTitle(
  title: string,
  navigation: NavbarNavigation,
  isFullScreenModal: boolean | undefined,
  themeColors: Colors,
  navigationPopEvent: IMetaMetricsEvent | null = null,
) {
  const innerStyles = StyleSheet.create({
    headerStyle: {
      backgroundColor: themeColors.background.default,
      shadowColor: importedColors.transparent,
      elevation: 0,
    },
    accessories: {
      marginHorizontal: 16,
    },
  });

  function navigationPop() {
    if (navigationPopEvent)
      trackEvent(
        MetricsEventBuilder.createEventBuilder(navigationPopEvent).build(),
      );
    asNavigation(navigation).goBack();
  }

  return {
    title,
    headerTitle: (
      <MorphText variant={TextVariant.HeadingMD}>{title}</MorphText>
    ) as unknown as string,
    headerRight: () =>
      isFullScreenModal ? (
        <ButtonIcon
          size={ButtonIconSizes.Lg}
          iconName={IconName.Close}
          onPress={navigationPop}
          style={innerStyles.accessories}
          testID={NetworksViewSelectorsIDs.CLOSE_ICON}
        />
      ) : null,
    headerLeft: () =>
      isFullScreenModal ? null : (
        <ButtonIcon
          size={ButtonIconSizes.Lg}
          iconName={IconName.ArrowLeft}
          onPress={navigationPop}
          style={innerStyles.accessories}
          testID={CommonSelectorsIDs.BACK_ARROW_BUTTON}
        />
      ),
    headerTintColor: themeColors.primary.default,
    ...innerStyles,
  };
}

/**
 * Function that returns the navigation options
 * This is used by contact form
 *
 * @param {string} title - Title in string format
 * @param {Object} navigation - Navigation object required to push new views
 * @returns {Object} - Corresponding navbar options
 */
export function getEditableOptions(
  title: string,
  navigation: NavbarNavigation,
  route: NavbarRoute,
  themeColors: Colors,
) {
  const innerStyles = StyleSheet.create({
    headerTitleStyle: {
      fontSize: 20,
      color: themeColors.text.default,
      ...fontStyles.normal,
    },
    headerIcon: {
      color: themeColors.primary.default,
    },
    headerButtonText: {
      color: themeColors.primary.default,
      fontSize: 14,
      ...fontStyles.normal,
    },
    headerStyle: {
      backgroundColor: themeColors.background.default,
      shadowColor: importedColors.transparent,
      elevation: 0,
    },
  });

  function navigationPop() {
    asNavigation(navigation).pop();
  }

  const rightAction = routeParams(route)?.dispatch;
  const editMode = routeParams(route)?.editMode === 'edit';
  const addMode = routeParams(route)?.mode === 'add';
  return {
    title,
    headerTitleStyle: innerStyles.headerTitleStyle,
    headerLeft: () => (
      <TouchableOpacity
        onPress={navigationPop}
        style={styles.backButton}
        testID={CommonSelectorsIDs.EDIT_CONTACT_BACK_BUTTON}
      >
        <IonicIcon
          name={'arrow-back'}
          size={Device.isAndroid() ? 24 : 28}
          style={innerStyles.headerIcon}
        />
      </TouchableOpacity>
    ),
    headerRight: () =>
      !addMode ? (
        <TouchableOpacity
          onPress={rightAction}
          style={styles.backButton}
          testID={AddContactViewSelectorsIDs.EDIT_BUTTON}
        >
          <Text style={innerStyles.headerButtonText}>
            {editMode
              ? strings('address_book.edit')
              : strings('address_book.cancel')}
          </Text>
        </TouchableOpacity>
      ) : (
        <View />
      ),
    headerStyle: innerStyles.headerStyle,
    headerTintColor: themeColors.primary.default,
  };
}

/**
 * Function that returns the navigation options
 * This is used by payment request view showing close and back buttons
 *
 * @param {string} title - Title in string format
 * @param {Object} navigation - Navigation object required to push new views
 * @returns {Object} - Corresponding navbar options containing title, headerLeft and headerRight
 */
export function getPaymentRequestOptionsTitle(
  title: string,
  navigation: NavbarNavigation,
  route: NavbarRoute,
  themeColors: Colors,
) {
  const goBack = routeParams(route)?.dispatch;
  const innerStyles = StyleSheet.create({
    headerTitleStyle: {
      fontSize: 20,
      color: themeColors.text.default,
      ...fontStyles.normal,
    },
    headerIcon: {
      color: themeColors.primary.default,
    },
    headerStyle: {
      backgroundColor: themeColors.background.default,
      shadowColor: importedColors.transparent,
      elevation: 0,
    },
  });

  return {
    title,
    headerTitleStyle: innerStyles.headerTitleStyle,
    headerLeft: () =>
      goBack ? (
        // eslint-disable-next-line react/jsx-no-bind
        <TouchableOpacity
          onPress={goBack}
          style={styles.backButton}
          testID={RequestPaymentViewSelectors.BACK_BUTTON_ID}
        >
          <IonicIcon
            name={'arrow-back'}
            size={Device.isAndroid() ? 24 : 28}
            style={innerStyles.headerIcon}
          />
        </TouchableOpacity>
      ) : (
        <View />
      ),
    headerRight: () => (
      // eslint-disable-next-line react/jsx-no-bind
      <TouchableOpacity
        onPress={() => asNavigation(navigation).pop()}
        style={styles.closeButton}
      >
        <IonicIcon
          name={'close'}
          size={38}
          style={[innerStyles.headerIcon, styles.backIconIOS]}
        />
      </TouchableOpacity>
    ),
    headerStyle: innerStyles.headerStyle,
    headerTintColor: themeColors.primary.default,
  };
}

/**
 * Function that returns the navigation options
 * This is used by payment request view showing close button
 *
 * @returns {Object} - Corresponding navbar options containing title, and headerRight
 */
export function getPaymentRequestSuccessOptionsTitle(
  navigation: NavbarNavigation,
  themeColors: Colors,
) {
  const innerStyles = StyleSheet.create({
    headerStyle: {
      backgroundColor: themeColors.background.default,
      shadowColor: importedColors.transparent,
      elevation: 0,
    },
    headerIcon: {
      color: themeColors.primary.default,
    },
  });

  return {
    headerStyle: innerStyles.headerStyle,
    title: null,
    headerLeft: () => <View />,
    headerRight: () => (
      <TouchableOpacity
        // eslint-disable-next-line react/jsx-no-bind
        onPress={() => asNavigation(navigation).pop()}
        style={styles.closeButton}
        {...generateTestId(
          Platform,
          SendLinkViewSelectorsIDs.CLOSE_SEND_LINK_VIEW_BUTTON,
        )}
      >
        <IonicIcon
          name="close"
          size={38}
          style={[innerStyles.headerIcon, styles.backIconIOS]}
        />
      </TouchableOpacity>
    ),
    headerTintColor: themeColors.primary.default,
  };
}

/**
 * Function that returns the navigation options
 * This is used by views that confirms transactions, showing current network
 *
 * @param {string} title - Title in string format
 * @returns {Object} - Corresponding navbar options containing title and headerTitleStyle
 */
export function getTransactionOptionsTitle(
  _title: string,
  navigation: NavbarNavigation,
  route: NavbarRoute,
  themeColors: Colors,
) {
  const innerStyles = StyleSheet.create({
    headerStyle: {
      backgroundColor: themeColors.background.default,
      shadowColor: importedColors.transparent,
      elevation: 0,
    },
    headerButtonText: {
      color: themeColors.primary.default,
      fontSize: 14,
      ...fontStyles.normal,
    },
  });
  const transactionMode = routeParams(route)?.mode ?? '';
  const { name } = route;
  const leftText =
    transactionMode === 'edit'
      ? strings('transaction.cancel')
      : strings('transaction.edit');
  const disableModeChange = routeParams(route)?.disableModeChange;
  const modeChange = routeParams(route)?.dispatch;
  const leftAction = () =>
    (modeChange as unknown as (mode: string) => void)('edit');
  const rightAction = () => asNavigation(navigation).pop();
  const rightText = strings('transaction.cancel');
  const title = transactionMode === 'edit' ? 'transaction.edit' : _title;

  return {
    headerTitle: () => <NavbarTitleView title={title} disableNetwork />,
    headerLeft: () =>
      transactionMode !== 'edit' ? (
        <TouchableOpacity
          disabled={disableModeChange}
          // eslint-disable-next-line react/jsx-no-bind
          onPress={leftAction}
          style={styles.closeButton}
          testID={CommonSelectorsIDs.CONFIRM_TXN_EDIT_BUTTON}
        >
          <Text
            style={
              disableModeChange
                ? [innerStyles.headerButtonText, styles.disabled]
                : innerStyles.headerButtonText
            }
          >
            {leftText}
          </Text>
        </TouchableOpacity>
      ) : (
        <View />
      ),
    headerRight: () =>
      name === 'Send' ? (
        // eslint-disable-next-line react/jsx-no-bind
        <TouchableOpacity
          onPress={rightAction}
          style={styles.closeButton}
          testID={CommonSelectorsIDs.SEND_BACK_BUTTON}
        >
          <Text style={innerStyles.headerButtonText}>{rightText}</Text>
        </TouchableOpacity>
      ) : (
        <View />
      ),
    headerStyle: innerStyles.headerStyle,
    headerTintColor: themeColors.primary.default,
  };
}

export function getApproveNavbar(title: string) {
  return {
    headerTitle: () => <NavbarTitleView title={title} disableNetwork />,
    headerLeft: () => <View />,
    headerRight: () => <View />,
  };
}

/**
 * Function that returns the navigation options
 * This is used by views in send flow
 *
 * @param {string} title - Title in string format
 * @returns {Object} - Corresponding navbar options containing title and headerTitleStyle
 */
export function getSendFlowTitle(
  title: string,
  navigation: NavbarNavigation,
  route: NavbarRoute,
  themeColors: Colors,
  resetTransaction: () => void,
  transaction: Parameters<typeof getBlockaidTransactionMetricsParams>[0],
) {
  const innerStyles = StyleSheet.create({
    headerButtonText: {
      color: themeColors.primary.default,
      fontSize: 14,
      ...fontStyles.normal,
    },
    headerStyle: {
      backgroundColor: themeColors.background.default,
      shadowColor: importedColors.transparent,
      elevation: 0,
    },
  });
  const rightAction = () => {
    const providerType = routeParams(route)?.providerType ?? '';
    const additionalTransactionMetricsParams =
      getBlockaidTransactionMetricsParams(transaction);
    trackEvent(
      MetricsEventBuilder.createEventBuilder(MetaMetricsEvents.SEND_FLOW_CANCEL)
        .addProperties({
          view: title.split('.')[1],
          network: providerType,
          ...additionalTransactionMetricsParams,
        })
        .build(),
    );
    resetTransaction();
    asNavigation(navigation).dangerouslyGetParent()?.pop();
  };
  const leftAction = () => asNavigation(navigation).pop();

  const canGoBack =
    title !== 'send.send_to' && !routeParams(route)?.isPaymentRequest;

  const titleToRender = title;

  return {
    headerTitle: () => <NavbarTitleView title={titleToRender} disableNetwork />,
    headerRight: () => (
      // eslint-disable-next-line react/jsx-no-bind
      <TouchableOpacity
        onPress={rightAction}
        style={styles.closeButton}
        testID={SendViewSelectorsIDs.SEND_CANCEL_BUTTON}
      >
        <Text style={innerStyles.headerButtonText}>
          {strings('transaction.cancel')}
        </Text>
      </TouchableOpacity>
    ),
    headerLeft: () =>
      canGoBack ? (
        // eslint-disable-next-line react/jsx-no-bind
        <TouchableOpacity onPress={leftAction} style={styles.closeButton}>
          <Text
            style={innerStyles.headerButtonText}
            testID={SendViewSelectorsIDs.SEND_BACK_BUTTON}
          >
            {strings('transaction.back')}
          </Text>
        </TouchableOpacity>
      ) : (
        <View />
      ),
    headerStyle: innerStyles.headerStyle,
  };
}

/**
 * Function that returns the navigation options
 * for our modals
 *
 * @param {string} title - Title in string format
 * @returns {Object} - Corresponding navbar options containing headerTitle
 */
export function getModalNavbarOptions(title: string) {
  return {
    headerTitle: () => <ModalNavbarTitle title={title} />,
  };
}

/**
 * Function that returns the navigation options
 * for our onboarding screens,
 * which is just the metamask log and the Back button
 *
 * @returns {Object} - Corresponding navbar options containing headerTitle, headerTitle and headerTitle
 */
export function getOnboardingNavbarOptions(
  route: NavbarRoute,
  // eslint-disable-next-line @typescript-eslint/default-param-last
  { headerLeft }: { headerLeft?: () => React.ReactNode } = {},
  themeColors: Colors,
) {
  const headerLeftHide = headerLeft || routeParams(route)?.headerLeft;
  const innerStyles = StyleSheet.create({
    headerStyle: {
      backgroundColor: themeColors.background.default,
      shadowColor: importedColors.transparent,
      elevation: 0,
    },
    metamaskName: {
      width: 70,
      height: 35,
      tintColor: themeColors.text.default,
    },
  });

  return {
    headerStyle: innerStyles.headerStyle,
    headerTitle: () => (
      <View style={styles.metamaskNameTransparentWrapper}>
        <Image
          source={metamask_name}
          style={innerStyles.metamaskName}
          resizeMethod={'auto'}
        />
      </View>
    ),
    headerBackTitle: strings('navigation.back'),
    headerRight: () => <View />,
    headerLeft: headerLeftHide,
    headerTintColor: themeColors.primary.default,
  };
}

/**
 * Function that returns a transparent navigation options for our onboarding screens.
 *
 * @returns {Object} - Corresponding navbar options containing headerTitle
 */
export function getTransparentOnboardingNavbarOptions(themeColors: Colors) {
  const innerStyles = StyleSheet.create({
    headerStyle: {
      backgroundColor: themeColors.background.default,
      shadowColor: importedColors.transparent,
      elevation: 0,
    },
    metamaskName: {
      width: 70,
      height: 35,
      tintColor: themeColors.text.default,
    },
  });
  return {
    headerTitle: () => (
      <View style={styles.metamaskNameTransparentWrapper}>
        <Image
          source={metamask_name}
          style={innerStyles.metamaskName}
          resizeMethod={'auto'}
        />
      </View>
    ),
    headerLeft: () => <View />,
    headerRight: () => <View />,
    headerStyle: innerStyles.headerStyle,
  };
}

/**
 * Function that returns a transparent navigation options for our onboarding screens.
 *
 * @returns {Object} - Corresponding navbar options containing headerTitle and a back button
 */
export function getTransparentBackOnboardingNavbarOptions(themeColors: Colors) {
  const innerStyles = StyleSheet.create({
    headerStyle: {
      backgroundColor: themeColors.background.default,
      shadowColor: importedColors.transparent,
      elevation: 0,
    },
    metamaskName: {
      width: 70,
      height: 35,
      tintColor: themeColors.text.default,
    },
  });
  return {
    headerTitle: () => (
      <View style={styles.metamaskNameTransparentWrapper}>
        <Image
          source={metamask_name}
          style={innerStyles.metamaskName}
          resizeMethod={'auto'}
        />
      </View>
    ),
    headerBackTitle: strings('navigation.back'),
    headerRight: () => <View />,
    headerStyle: innerStyles.headerStyle,
    headerTintColor: themeColors.primary.default,
  };
}

/**
 * Function that returns the navigation options
 * for our metric opt-in screen
 *
 * @returns {Object} - Corresponding navbar options containing headerLeft
 */
export function getOptinMetricsNavbarOptions(themeColors: Colors) {
  const innerStyles = StyleSheet.create({
    headerStyle: {
      backgroundColor: themeColors.background.default,
      shadowColor: importedColors.transparent,
      elevation: 0,
    },
    metamaskName: {
      width: 70,
      height: 35,
      tintColor: themeColors.text.default,
    },
  });
  return {
    headerTitle: () => (
      <View style={styles.metamaskNameTransparentWrapper}>
        <Image
          source={metamask_name}
          style={innerStyles.metamaskName}
          resizeMethod={'auto'}
        />
      </View>
    ),
    headerBackTitle: strings('navigation.back'),
    headerRight: () => <View />,
    headerStyle: innerStyles.headerStyle,
    headerTintColor: themeColors.primary.default,
  };
}

/**
 * Function that returns the navigation options
 * for our closable screens,
 *
 * @returns {Object} - Corresponding navbar options containing headerTitle, headerTitle and headerTitle
 */
export function getClosableNavigationOptions(
  title: string,
  backButtonText: string,
  navigation: NavbarNavigation,
  themeColors: Colors,
) {
  const innerStyles = StyleSheet.create({
    headerButtonText: {
      color: themeColors.primary.default,
      fontSize: 14,
      ...fontStyles.normal,
    },
    headerIcon: {
      color: themeColors.primary.default,
    },
    headerStyle: {
      backgroundColor: themeColors.background.default,
      shadowColor: importedColors.transparent,
      elevation: 0,
    },
    headerTitleStyle: {
      fontSize: 20,
      ...fontStyles.normal,
      color: themeColors.text.default,
    },
  });

  function navigationPop() {
    asNavigation(navigation).pop();
  }

  return {
    title,
    headerTitleStyle: innerStyles.headerTitleStyle,
    headerLeft: () =>
      Device.isIos() ? (
        <TouchableOpacity
          onPress={navigationPop}
          style={styles.closeButton}
          testID={CommonSelectorsIDs.NAV_IOS_BACK}
        >
          <Text style={innerStyles.headerButtonText}>{backButtonText}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={navigationPop}
          style={styles.backButton}
          {...generateTestId(Platform, NAV_ANDROID_BACK_BUTTON)}
        >
          <IonicIcon
            name={'arrow-back'}
            size={24}
            style={innerStyles.headerIcon}
          />
        </TouchableOpacity>
      ),
    headerStyle: innerStyles.headerStyle,
    headerTintColor: themeColors.primary.default,
  };
}

/**
 * Function that returns the navigation options
 * for our closable screens,
 *
 * @returns {Object} - Corresponding navbar options containing headerTitle, headerTitle and headerTitle
 */
export function getOfflineModalNavbar() {
  return {
    headerShown: false,
  };
}

/**
 * Function that returns the navigation options for the wallet screen.
 *
 * @param {Object} accountActionsRef - The ref object for the account actions
 * @param {Object} selectedInternalAccount - The currently selected internal account
 * @param {string} accountName - The name of the currently selected account
 * @param {string} accountAvatarType - The type of avatar for the currently selected account
 * @param {string} networkName - The name of the current network
 * @param {Object} networkImageSource - The image source for the network icon
 * @param {Function} onPressTitle - Callback function when the title is pressed
 * @param {Object} navigation - The navigation object
 * @param {Object} themeColors - The theme colors object
 * @param {boolean} isNotificationEnabled - Whether notifications are enabled
 * @param {boolean | null} isBackupAndSyncEnabled - Whether backup and sync is enabled
 * @param {number} unreadNotificationCount - The number of unread notifications
 * @param {number} readNotificationCount - The number of read notifications
 * @param {boolean} isNonEvmSelected - Whether a non evm network is selected
 * @returns {Object} An object containing the navbar options for the wallet screen
 */
export function getWalletNavbarOptions(
  accountActionsRef: React.Ref<React.ComponentRef<typeof PickerAccount>>,
  selectedInternalAccount: InternalAccount,
  accountName: string,
  accountAvatarType: React.ComponentProps<
    typeof PickerAccount
  >['accountAvatarType'],
  networkName: string,
  networkImageSource: ImageSourcePropType,
  onPressTitle: () => void,
  navigation: NavbarNavigation,
  themeColors: Colors,
  isNotificationEnabled: boolean,
  isBackupAndSyncEnabled: boolean | null,
  unreadNotificationCount: number,
  readNotificationCount: number,
) {
  const innerStyles = StyleSheet.create({
    headerStyle: {
      backgroundColor: themeColors.background as unknown as ColorValue,
      shadowColor: importedColors.transparent,
      elevation: 0,
    },
    headerIcon: {
      color: themeColors.primary.default,
    },
    headerTitle: {
      justifyContent: 'center',
      marginTop: 5,
      flex: 1,
    },
  });

  let formattedAddress = toChecksumHexAddress(selectedInternalAccount.address);

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  formattedAddress = getFormattedAddressFromInternalAccount(
    selectedInternalAccount,
  );
  ///: END:ONLY_INCLUDE_IF

  const onScanSuccess = (
    data: { private_key?: string; seed?: string },
    content: string,
  ) => {
    if (data.private_key) {
      Alert.alert(
        strings('wallet.private_key_detected'),
        strings('wallet.do_you_want_to_import_this_account'),
        [
          {
            text: strings('wallet.cancel'),
            onPress: () => false,
            style: 'cancel',
          },
          {
            text: strings('wallet.yes'),
            onPress: async () => {
              try {
                await importAccountFromPrivateKey(data.private_key as string);
                asNavigation(navigation).navigate(...([
                  'ImportPrivateKeyView',
                  { screen: 'ImportPrivateKeySuccess' },
                ] as unknown as never[]));
              } catch (e) {
                Alert.alert(
                  strings('import_private_key.error_title'),
                  strings('import_private_key.error_message'),
                );
              }
            },
          },
        ],
        { cancelable: false },
      );
    } else if (data.seed) {
      Alert.alert(
        strings('wallet.error'),
        strings('wallet.logout_to_import_seed'),
      );
    } else {
      setTimeout(() => {
        DeeplinkManager.parse(content, {
          origin: AppConstants.DEEPLINKS.ORIGIN_QR_CODE,
        });
      }, 500);
    }
  };

  function openQRScanner() {
    asNavigation(navigation).navigate(...([
      Routes.QR_TAB_SWITCHER,
      { onScanSuccess },
    ] as unknown as never[]));
    trackEvent(
      MetricsEventBuilder.createEventBuilder(
        MetaMetricsEvents.WALLET_QR_SCANNER,
      ).build(),
    );
  }

  function handleNotificationOnPress() {
    if (isNotificationEnabled && isNotificationsFeatureEnabled()) {
      asNavigation(navigation).navigate(
        ...([Routes.NOTIFICATIONS.VIEW] as unknown as never[]),
      );
      trackEvent(
        MetricsEventBuilder.createEventBuilder(
          MetaMetricsEvents.NOTIFICATIONS_MENU_OPENED,
        )
          .addProperties({
            unread_count: unreadNotificationCount,
            read_count: readNotificationCount,
          })
          .build(),
      );
    } else {
      asNavigation(navigation).navigate(
        ...([Routes.NOTIFICATIONS.OPT_IN_STACK] as unknown as never[]),
      );
      trackEvent(
        MetricsEventBuilder.createEventBuilder(
          MetaMetricsEvents.NOTIFICATIONS_ACTIVATED,
        )
          .addProperties({
            action_type: 'started',
            is_profile_syncing_enabled: isBackupAndSyncEnabled,
          })
          .build(),
      );
    }
  }

  const renderNetworkPicker = () => {
    const networkPicker = (
      <PickerNetwork
        label={networkName}
        imageSource={networkImageSource}
        onPress={onPressTitle}
        testID={WalletViewSelectorsIDs.NAVBAR_NETWORK_BUTTON}
        hideNetworkName
      />
    );

    return <View style={styles.leftElementContainer}>{networkPicker}</View>;
  };

  return {
    headerTitle: () => (
      <View style={innerStyles.headerTitle}>
        <PickerAccount
          ref={accountActionsRef}
          accountAddress={formattedAddress}
          accountName={accountName}
          accountAvatarType={accountAvatarType}
          onPress={() => {
            asNavigation(navigation).navigate(
              ...(createAccountSelectorNavDetails({}) as unknown as never[]),
            );
          }}
          accountTypeLabel={
            getLabelTextByAddress(formattedAddress) || undefined
          }
          showAddress
          cellAccountContainerStyle={
            (styles as { account?: undefined }).account
          }
          testID={WalletViewSelectorsIDs.ACCOUNT_ICON}
        />
      </View>
    ),
    headerLeft: () => renderNetworkPicker(),
    headerRight: () => (
      <View style={styles.rightElementContainer}>
        <View
          testID={WalletViewSelectorsIDs.NAVBAR_ADDRESS_COPY_BUTTON}
          style={styles.addressCopyWrapper}
        >
          <AddressCopy />
        </View>
        {isNotificationsFeatureEnabled() && (
          <View>
            {/* Icon */}
            <ButtonIcon
              iconColor={IconColor.Default}
              onPress={handleNotificationOnPress}
              iconName={IconName.Notification}
              size={IconSize.Xl as unknown as ButtonIconSizes}
              testID={WalletViewSelectorsIDs.WALLET_NOTIFICATIONS_BUTTON}
              style={(styles as { notificationButton?: undefined }).notificationButton}
            />

            {/* Badge Dot */}
            {isNotificationEnabled && (
              <View
                style={[
                  styles.notificationsBadge,
                  {
                    backgroundColor: unreadNotificationCount
                      ? themeColors.error.default
                      : (themeColors.background as { transparent?: ColorValue })
                          .transparent,
                  },
                ]}
              />
            )}
          </View>
        )}

        <ButtonIcon
          iconColor={IconColor.Default}
          onPress={openQRScanner}
          iconName={IconName.ScanBarcode}
          size={IconSize.Xl as unknown as ButtonIconSizes}
          testID={WalletViewSelectorsIDs.WALLET_SCAN_BUTTON}
        />
      </View>
    ),
    headerStyle: innerStyles.headerStyle,
    headerTintColor: themeColors.primary.default,
  };
}

/**
 * Function that returns the navigation options containing title and network indicator
 *
 * @param {string} title - Title in string format
 * @param {boolean} translate - Boolean that specifies if the title needs translation
 * @param {Object} navigation - Navigation object required to push new views
 * @param {Object} themeColors - Colors from theme
 * @param {boolean} disableNetwork - Boolean that determines if network is accessible from navbar
 * @param {Function} onClose - Onclose navbar function
 * @returns {Object} - Corresponding navbar options containing headerTitle and headerTitle
 */
export function getImportTokenNavbarOptions(
  title: string,
  translate: boolean,
  navigation: NavbarNavigation,
  themeColors: Colors,
  disableNetwork = false,
  contentOffset = 0,
  onClose: (() => void) | undefined = undefined,
) {
  const innerStyles = StyleSheet.create({
    headerStyle: {
      backgroundColor: themeColors.background.default,
      shadowColor: importedColors.transparent,
      elevation: 0,
    },
    headerShadow: {
      elevation: 2,
      shadowColor: (themeColors.background as { primary?: ColorValue }).primary,
      shadowOpacity: contentOffset < 20 ? contentOffset / 100 : 0.2,
      shadowOffset: { height: 4, width: 0 },
      shadowRadius: 8,
    },
    headerIcon: {
      color: themeColors.primary.default,
    },
    title: {
      textAlign: 'center',
      fontWeight: 'bold',
    },
  });
  return {
    headerTitle: () => (
      <NavbarTitleView
        disableNetwork={disableNetwork}
        showSelectedNetwork={false}
        translate={translate}
      >
        {title}
      </NavbarTitleView>
    ),
    headerRight: () => (
      // eslint-disable-next-line react/jsx-no-bind
      <TouchableOpacity
        style={styles.backButton}
        testID={CommonSelectorsIDs.BACK_ARROW_BUTTON}
      >
        <ButtonIcon
          iconName={IconName.Close}
          iconColor={IconColor.Default}
          size={ButtonIconSizes.Lg}
          onPress={
            onClose
              ? () => onClose()
              : () =>
                  asNavigation(navigation).navigate(...([
                    Routes.WALLET.HOME,
                    {
                      screen: Routes.WALLET.TAB_STACK_FLOW,
                      params: {
                        screen: Routes.WALLET_VIEW,
                      },
                    },
                  ] as unknown as never[]))
          }
        />
      </TouchableOpacity>
    ),
    headerLeft: null,
    headerStyle: [
      innerStyles.headerStyle,
      contentOffset && innerStyles.headerShadow,
    ],
  };
}

export function getNftDetailsNavbarOptions(
  navigation: NavbarNavigation,
  themeColors: Colors,
  onRightPress: (() => void) | undefined,
  contentOffset = 0,
) {
  const innerStyles = StyleSheet.create({
    headerStyle: {
      backgroundColor: themeColors.background.default,
      shadowColor: importedColors.transparent,
      elevation: 0,
    },
    headerShadow: {
      elevation: 2,
      shadowColor: (themeColors.background as { primary?: ColorValue }).primary,
      shadowOpacity: contentOffset < 20 ? contentOffset / 100 : 0.2,
      shadowOffset: { height: 4, width: 0 },
      shadowRadius: 8,
    },
    headerIcon: {
      color: themeColors.primary.default,
    },
    headerBackIcon: {
      color: themeColors.icon.default,
    },
  });
  return {
    headerLeft: () => (
      <TouchableOpacity
        onPress={() => asNavigation(navigation).pop()}
        style={styles.backButton}
        testID={CommonSelectorsIDs.BACK_ARROW_BUTTON}
      >
        <Icon
          name={IconName.ArrowLeft}
          size={IconSize.Lg}
          style={innerStyles.headerBackIcon as StyleProp<ViewStyle>}
        />
      </TouchableOpacity>
    ),
    headerRight: onRightPress
      ? () => (
          <TouchableOpacity style={styles.backButton} onPress={onRightPress}>
            <Icon
              name={IconName.MoreVertical}
              size={IconSize.Lg}
              style={innerStyles.headerBackIcon as StyleProp<ViewStyle>}
            />
          </TouchableOpacity>
        )
      : () => <View />,
    headerStyle: [
      innerStyles.headerStyle,
      contentOffset && innerStyles.headerShadow,
    ],
  };
}

export function getNftFullImageNavbarOptions(
  navigation: NavbarNavigation,
  themeColors: Colors,
  contentOffset = 0,
) {
  const innerStyles = StyleSheet.create({
    headerStyle: {
      backgroundColor: themeColors.background.default,
      shadowColor: importedColors.transparent,
      elevation: 0,
    },
    headerShadow: {
      elevation: 2,
      shadowColor: (themeColors.background as { primary?: ColorValue }).primary,
      shadowOpacity: contentOffset < 20 ? contentOffset / 100 : 0.2,
      shadowOffset: { height: 4, width: 0 },
      shadowRadius: 8,
    },
    headerIcon: {
      color: themeColors.primary.default,
    },
    headerBackIcon: {
      color: themeColors.icon.default,
    },
  });
  return {
    headerRight: () => (
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => asNavigation(navigation).pop()}
      >
        <Icon
          name={IconName.Close}
          size={IconSize.Lg}
          style={innerStyles.headerBackIcon as StyleProp<ViewStyle>}
        />
      </TouchableOpacity>
    ),
    headerLeft: () => <View />,
    headerStyle: [
      innerStyles.headerStyle,
      contentOffset && innerStyles.headerShadow,
    ],
  };
}

/**
 * Function that returns the navigation options containing title and network indicator
 *
 * @param {string} title - Title in string format
 * @param {boolean} translate - Boolean that specifies if the title needs translation
 * @param {Object} navigation - Navigation object required to push new views
 * @param {Object} themeColors - Colors from theme
 * @param {Function} onRightPress - Callback that determines if right button exists
 * @param {boolean} disableNetwork - Boolean that determines if network is accessible from navbar
 * @returns {Object} - Corresponding navbar options containing headerTitle and headerTitle
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
export function getNetworkNavbarOptions(
  title: string,
  translate: boolean,
  navigation: NavbarNavigation,
  themeColors: Colors,
  onRightPress: (() => void) | undefined = undefined,
  disableNetwork = false,
  contentOffset = 0,
  networkName = '',
) {
  return {
    header: () => (
      <HeaderBase
        includesTopInset
        startAccessory={
          <ButtonIcon
            style={styles.headerLeftButton}
            onPress={() => asNavigation(navigation).pop()}
            testID={CommonSelectorsIDs.BACK_ARROW_BUTTON}
            size={ButtonIconSizes.Lg}
            iconName={IconName.ArrowLeft}
            iconColor={IconColor.Default}
          />
        }
        endAccessory={
          onRightPress && (
            <ButtonIcon
              style={styles.headerRightButton}
              onPress={onRightPress}
              size={ButtonIconSizes.Lg}
              iconName={IconName.MoreVertical}
              iconColor={IconColor.Default}
            />
          )
        }
      >
        <NavbarTitleView
          disableNetwork={disableNetwork}
          title={title}
          translate={translate}
          networkName={networkName}
        />
      </HeaderBase>
    ),
  };
}
/* eslint-enable @typescript-eslint/no-unused-vars */

/**
 * Function that returns the navigation options containing title and network indicator
 *
 * @returns {Object} - Corresponding navbar options containing headerTitle and headerTitle
 */
export function getWebviewNavbar(
  navigation: NavbarNavigation,
  route: NavbarRoute,
  themeColors: Colors,
) {
  const innerStyles = StyleSheet.create({
    headerTitleStyle: {
      fontSize: 20,
      color: themeColors.text.default,
      textAlign: 'center',
      ...fontStyles.normal,
      alignItems: 'center',
    },
    headerStyle: {
      backgroundColor: themeColors.background.default,
      shadowColor: importedColors.transparent,
      elevation: 0,
    },
    headerIcon: {
      color: (themeColors as { default?: ColorValue }).default,
    },
  });

  const title = routeParams(route)?.title ?? '';
  const share = routeParams(route)?.dispatch;
  return {
    headerTitle: () => (
      <Text style={innerStyles.headerTitleStyle}>{title}</Text>
    ),
    headerLeft: () =>
      Device.isAndroid() ? (
        // eslint-disable-next-line react/jsx-no-bind
        <TouchableOpacity
          onPress={() => asNavigation(navigation).pop()}
          style={styles.backButton}
          {...generateTestId(Platform, BACK_BUTTON_SIMPLE_WEBVIEW)}
        >
          <IonicIcon
            name={'arrow-back'}
            size={24}
            style={innerStyles.headerIcon}
          />
        </TouchableOpacity>
      ) : (
        // eslint-disable-next-line react/jsx-no-bind
        <TouchableOpacity
          onPress={() => asNavigation(navigation).pop()}
          style={styles.backButton}
        >
          <IonicIcon
            name="close"
            size={38}
            style={[innerStyles.headerIcon, styles.backIconIOS]}
          />
        </TouchableOpacity>
      ),
    headerRight: () =>
      Device.isAndroid() ? (
        <TouchableOpacity onPress={share} style={styles.backButton}>
          <MaterialCommunityIcon
            name="share-variant"
            size={24}
            style={innerStyles.headerIcon}
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={share} style={styles.backButton}>
          <EvilIcons
            name="share-apple"
            size={32}
            style={[innerStyles.headerIcon, styles.shareIconIOS]}
          />
        </TouchableOpacity>
      ),
    headerStyle: innerStyles.headerStyle,
  };
}

export function getPaymentSelectorMethodNavbar(
  navigation: NavbarNavigation,
  onPop: (() => void) | undefined,
  themeColors: Colors,
) {
  const innerStyles = StyleSheet.create({
    headerButtonText: {
      color: themeColors.primary.default,
    },
    headerTitleStyle: {
      fontSize: 20,
      color: themeColors.text.default,
      textAlign: 'center',
      ...fontStyles.normal,
      alignItems: 'center',
    },
    headerStyle: {
      backgroundColor: themeColors.background.default,
      shadowColor: importedColors.transparent,
      elevation: 0,
    },
  });
  return {
    headerTitle: () => (
      <Text style={innerStyles.headerTitleStyle}>
        {strings('fiat_on_ramp.purchase_method')}
      </Text>
    ),
    headerLeft: () => <View />,
    headerRight: () => (
      // eslint-disable-next-line react/jsx-no-bind
      <TouchableOpacity
        onPress={() => {
          asNavigation(navigation).dangerouslyGetParent()?.pop();
          onPop?.();
        }}
        style={styles.closeButton}
      >
        <Text style={innerStyles.headerButtonText}>
          {strings('navigation.cancel')}
        </Text>
      </TouchableOpacity>
    ),
    headerStyle: innerStyles.headerStyle,
  };
}

export function getPaymentMethodApplePayNavbar(
  navigation: NavbarNavigation,
  onPop: (() => void) | undefined,
  onExit: (() => void) | undefined,
  themeColors: Colors,
) {
  const innerStyles = StyleSheet.create({
    headerTitleStyle: {
      fontSize: 20,
      color: themeColors.text.default,
      ...fontStyles.normal,
    },
    headerStyle: {
      backgroundColor: themeColors.background.default,
      shadowColor: importedColors.transparent,
      elevation: 0,
    },
    headerButtonText: {
      color: themeColors.primary.default,
    },
    headerIcon: {
      color: themeColors.primary.default,
    },
  });
  return {
    title: strings('fiat_on_ramp.amount_to_buy'),
    headerTitleStyle: innerStyles.headerTitleStyle,
    headerRight: () => (
      // eslint-disable-next-line react/jsx-no-bind
      <TouchableOpacity
        onPress={() => {
          asNavigation(navigation).dangerouslyGetParent()?.pop();
          onExit?.();
        }}
        style={styles.closeButton}
      >
        <Text style={innerStyles.headerButtonText}>
          {strings('navigation.cancel')}
        </Text>
      </TouchableOpacity>
    ),
    headerLeft: () =>
      Device.isAndroid() ? (
        // eslint-disable-next-line react/jsx-no-bind
        <TouchableOpacity
          onPress={() => {
            asNavigation(navigation).pop();
            onPop?.();
          }}
          style={styles.backButton}
        >
          <IonicIcon
            name={'arrow-back'}
            size={24}
            style={innerStyles.headerIcon}
          />
        </TouchableOpacity>
      ) : (
        // eslint-disable-next-line react/jsx-no-bind
        <TouchableOpacity
          onPress={() => {
            asNavigation(navigation).pop();
            onPop?.();
          }}
          style={styles.closeButton}
        >
          <Text style={innerStyles.headerButtonText}>
            {strings('navigation.back')}
          </Text>
        </TouchableOpacity>
      ),
    headerStyle: innerStyles.headerStyle,
  };
}

export function getTransakWebviewNavbar(
  navigation: NavbarNavigation,
  route: NavbarRoute,
  onPop: (() => void) | undefined,
  themeColors: Colors,
) {
  const innerStyles = StyleSheet.create({
    headerTitleStyle: {
      fontSize: 20,
      color: themeColors.text.default,
      ...fontStyles.normal,
    },
    headerStyle: {
      backgroundColor: themeColors.background.default,
      shadowColor: importedColors.transparent,
      elevation: 0,
    },
    headerIcon: {
      color: themeColors.primary.default,
    },
  });

  const title = routeParams(route)?.title ?? '';
  return {
    title,
    headerTitleStyle: innerStyles.headerTitleStyle,
    headerLeft: () =>
      Device.isAndroid() ? (
        // eslint-disable-next-line react/jsx-no-bind
        <TouchableOpacity
          onPress={() => {
            asNavigation(navigation).pop();
            onPop?.();
          }}
          style={styles.backButton}
        >
          <IonicIcon
            name={'arrow-back'}
            size={24}
            style={innerStyles.headerIcon}
          />
        </TouchableOpacity>
      ) : (
        // eslint-disable-next-line react/jsx-no-bind
        <TouchableOpacity
          onPress={() => {
            asNavigation(navigation).pop();
            onPop?.();
          }}
          style={styles.backButton}
        >
          <IonicIcon
            name="close"
            size={38}
            style={[innerStyles.headerIcon, styles.backIconIOS]}
          />
        </TouchableOpacity>
      ),
    headerStyle: innerStyles.headerStyle,
    headerTintColor: themeColors.primary.default,
  };
}

export function getSwapsAmountNavbar(
  navigation: NavbarNavigation,
  route: NavbarRoute,
  themeColors: Colors,
) {
  const innerStyles = StyleSheet.create({
    headerButtonText: {
      color: themeColors.primary.default,
      fontSize: 14,
      ...fontStyles.normal,
    },
    headerStyle: {
      backgroundColor: themeColors.background.default,
      shadowColor: importedColors.transparent,
      elevation: 0,
    },
  });
  const title = routeParams(route)?.title ?? 'Swap';
  return {
    headerTitle: () => (
      <NavbarTitleView title={title} disableNetwork translate={false} />
    ),
    headerLeft: () => <View />,
    headerRight: () => (
      // eslint-disable-next-line react/jsx-no-bind
      <TouchableOpacity
        onPress={() => asNavigation(navigation).dangerouslyGetParent()?.pop()}
        style={styles.closeButton}
      >
        <Text style={innerStyles.headerButtonText}>
          {strings('navigation.cancel')}
        </Text>
      </TouchableOpacity>
    ),
    headerStyle: innerStyles.headerStyle,
  };
}

export function getSwapsQuotesNavbar(
  navigation: NavbarNavigation,
  route: NavbarRoute,
  themeColors: Colors,
) {
  const innerStyles = StyleSheet.create({
    headerButtonText: {
      color: themeColors.primary.default,
      fontSize: 14,
      ...fontStyles.normal,
    },
    headerIcon: {
      color: themeColors.primary.default,
    },
    headerStyle: {
      backgroundColor: themeColors.background.default,
      shadowColor: importedColors.transparent,
      elevation: 0,
    },
  });
  const title = routeParams(route)?.title ?? 'Swap';
  const leftActionText =
    routeParams(route)?.leftAction ?? strings('navigation.back');

  const leftAction = () => {
    const trade = routeParams(route)
      ?.requestedTrade as NonNullable<NavbarRouteParams['requestedTrade']>;
    const selectedQuote = routeParams(route)?.selectedQuote;
    const quoteBegin = routeParams(route)?.quoteBegin as number;
    if (!selectedQuote) {
      trackEvent(
        MetricsEventBuilder.createEventBuilder(
          MetaMetricsEvents.QUOTES_REQUEST_CANCELLED,
        )
          .addProperties({
            token_from: trade.token_from,
            token_to: trade.token_to,
            request_type: trade.request_type,
            custom_slippage: trade.custom_slippage,
            chain_id: trade.chain_id,
            responseTime: new Date().getTime() - quoteBegin,
          })
          .addSensitiveProperties({
            token_from_amount: trade.token_from_amount,
          })
          .build(),
      );
    }
    asNavigation(navigation).pop();
  };

  const rightAction = () => {
    const trade = routeParams(route)
      ?.requestedTrade as NonNullable<NavbarRouteParams['requestedTrade']>;
    const selectedQuote = routeParams(route)?.selectedQuote;
    const quoteBegin = routeParams(route)?.quoteBegin as number;
    if (!selectedQuote) {
      trackEvent(
        MetricsEventBuilder.createEventBuilder(
          MetaMetricsEvents.QUOTES_REQUEST_CANCELLED,
        )
          .addProperties({
            token_from: trade.token_from,
            token_to: trade.token_to,
            request_type: trade.request_type,
            custom_slippage: trade.custom_slippage,
            chain_id: trade.chain_id,
            responseTime: new Date().getTime() - quoteBegin,
          })
          .addSensitiveProperties({
            token_from_amount: trade.token_from_amount,
          })
          .build(),
      );
    }
    asNavigation(navigation).dangerouslyGetParent()?.pop();
  };

  return {
    headerTitle: () => (
      <NavbarTitleView title={title} disableNetwork translate={false} />
    ),
    headerLeft: () =>
      Device.isAndroid() ? (
        // eslint-disable-next-line react/jsx-no-bind
        <TouchableOpacity onPress={leftAction} style={styles.backButton}>
          <IonicIcon
            name={'arrow-back'}
            size={24}
            style={innerStyles.headerIcon}
          />
        </TouchableOpacity>
      ) : (
        // eslint-disable-next-line react/jsx-no-bind
        <TouchableOpacity onPress={leftAction} style={styles.closeButton}>
          <Text style={innerStyles.headerButtonText}>{leftActionText}</Text>
        </TouchableOpacity>
      ),
    headerRight: () => (
      // eslint-disable-next-line react/jsx-no-bind
      <TouchableOpacity onPress={rightAction} style={styles.closeButton}>
        <Text style={innerStyles.headerButtonText}>
          {strings('navigation.cancel')}
        </Text>
      </TouchableOpacity>
    ),
    headerStyle: innerStyles.headerStyle,
  };
}

export function getBridgeNavbar(
  navigation: NavbarNavigation,
  route: NavbarRoute,
  themeColors: Colors,
) {
  const innerStyles = StyleSheet.create({
    headerButtonText: {
      color: themeColors.primary.default,
      fontSize: 14,
      ...fontStyles.normal,
    },
    headerStyle: {
      backgroundColor: themeColors.background.default,
      shadowColor: importedColors.transparent,
      elevation: 0,
    },
  });

  let title = `${strings('swaps.title')}/${strings('bridge.title')}`;
  if (routeParams(route)?.bridgeViewMode === BridgeViewMode.Bridge) {
    title = strings('bridge.title');
  } else if (routeParams(route)?.bridgeViewMode === BridgeViewMode.Swap) {
    title = strings('swaps.title');
  }

  const leftAction = () => asNavigation(navigation).pop();

  return {
    headerTitle: () => (
      <NavbarTitleView
        title={title}
        disableNetwork
        showSelectedNetwork={false}
        translate={false}
      />
    ),
    headerLeft: () => (
      <TouchableOpacity onPress={leftAction} style={styles.backButton}>
        <Icon name={IconName.ArrowLeft} />
      </TouchableOpacity>
    ),
    headerRight: () => (
      // eslint-disable-next-line react/jsx-no-bind
      <TouchableOpacity
        onPress={() => asNavigation(navigation).dangerouslyGetParent()?.pop()}
        style={styles.closeButton}
      >
        <Text style={innerStyles.headerButtonText}>
          {strings('navigation.cancel')}
        </Text>
      </TouchableOpacity>
    ),
    headerStyle: innerStyles.headerStyle,
  };
}

export function getBridgeTransactionDetailsNavbar(
  navigation: NavbarNavigation,
) {
  const leftAction = () => asNavigation(navigation).pop();

  return {
    headerTitle: () => (
      <NavbarTitleView
        title={strings('bridge_transaction_details.transaction_details')}
        disableNetwork
        showSelectedNetwork={false}
        translate={false}
      />
    ),
    headerLeft: () => (
      <TouchableOpacity onPress={leftAction} style={styles.backButton}>
        <Icon name={IconName.ArrowLeft} />
      </TouchableOpacity>
    ),
  };
}

export function getFiatOnRampAggNavbar(
  navigation: NavbarNavigation,
  // eslint-disable-next-line @typescript-eslint/default-param-last
  {
    title = 'Buy',
    showBack = true,
    showCancel = true,
  }: { title?: string; showBack?: boolean; showCancel?: boolean } = {},
  themeColors: Colors,
  onCancel?: () => void,
) {
  const innerStyles = StyleSheet.create({
    headerButtonText: {
      color: themeColors.primary.default,
      fontSize: scale(11),
      ...fontStyles.normal,
    },
    headerStyle: {
      backgroundColor: themeColors.background.default,
      shadowColor: importedColors.transparent,
      elevation: 0,
    },
    headerTitleStyle: {
      fontSize: 18,
      ...fontStyles.normal,
      color: themeColors.text.default,
      ...(!showBack && { textAlign: 'center' }),
    },
  });

  const leftActionText = strings('navigation.back');

  const leftAction = () => asNavigation(navigation).pop();

  const navigationCancelText = strings('navigation.cancel');

  return {
    headerTitle: () => (
      <NavbarTitleView title={title} disableNetwork translate={false} />
    ),
    headerLeft: () => {
      if (!showBack) return <View />;

      return Device.isAndroid() ? (
        <TouchableOpacity
          onPress={leftAction}
          style={styles.backButton}
          accessibilityRole="button"
          accessible
        >
          <IonicIcon
            name={'arrow-back'}
            size={24}
            style={(innerStyles as { headerIcon?: never }).headerIcon}
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={leftAction}
          style={styles.closeButton}
          accessibilityRole="button"
          accessible
        >
          <Text style={innerStyles.headerButtonText}>{leftActionText}</Text>
        </TouchableOpacity>
      );
    },
    headerRight: () => {
      if (!showCancel) return <View />;
      return (
        <TouchableOpacity
          onPress={() => {
            asNavigation(navigation).dangerouslyGetParent()?.pop();
            onCancel?.();
          }}
          style={styles.closeButton}
          accessibilityRole="button"
          accessible
        >
          <Text style={innerStyles.headerButtonText}>
            {navigationCancelText}
          </Text>
        </TouchableOpacity>
      );
    },
    headerStyle: innerStyles.headerStyle,
    headerTitleStyle: innerStyles.headerTitleStyle,
  };
}

export const getEditAccountNameNavBarOptions = (
  goBack: () => void,
  themeColors: Colors,
) => {
  const innerStyles = StyleSheet.create({
    headerStyle: {
      backgroundColor: themeColors.background.default,
      shadowColor: importedColors.transparent,
      elevation: 0,
    },
    headerTitleStyle: {
      fontSize: 18,
      ...fontStyles.normal,
      color: themeColors.text.default,
    },
  });

  return {
    headerTitle: (
      <Text>{strings('account_actions.edit_name')}</Text>
    ) as unknown as string,
    headerLeft: null,
    headerRight: () => (
      <ButtonIcon
        iconName={IconName.Close}
        size={ButtonIconSizes.Lg}
        onPress={goBack}
        style={styles.closeButton}
      />
    ),
    ...innerStyles,
  };
};

export const getSettingsNavigationOptions = (
  title: string,
  themeColors: Colors,
) => {
  const innerStyles = StyleSheet.create({
    headerStyle: {
      backgroundColor: themeColors.background.default,
      shadowColor: importedColors.transparent,
      elevation: 0,
    },
  });
  return {
    headerLeft: null,
    headerTitle: (
      <MorphText variant={TextVariant.HeadingMD}>{title}</MorphText>
    ) as unknown as string,
    ...innerStyles,
  };
};

/**
 *
 * @param {String} title - Navbar Title.
 * @param {NavigationProp<ParamListBase>} navigation Navigation object returned from useNavigation hook.
 * @param {ThemeColors} themeColors theme.colors returned from useStyles hook.
 * @param {{ backgroundColor?: string, hasCancelButton?: boolean, hasBackButton?: boolean, hasIconButton?: boolean, handleIconPress?: () => void }} [navBarOptions] - Optional navbar options.
 * @param {{ cancelButtonEvent?: { event: IMetaMetricsEvent, properties: Record<string, string> }, backButtonEvent?: { event: IMetaMetricsEvent, properties: Record<string, string>}, iconButtonEvent?: { event: IMetaMetricsEvent, properties: Record<string, string> } }} [metricsOptions] - Optional metrics options.
 * @returns Staking Navbar Component.
 */
export function getStakingNavbar(
  title: string,
  navigation: NavbarNavigation,
  themeColors: Colors,
  navBarOptions?: {
    backgroundColor?: string;
    hasCancelButton?: boolean;
    hasBackButton?: boolean;
    hasIconButton?: boolean;
    handleIconPress?: () => void;
  },
  metricsOptions?: {
    cancelButtonEvent?: MetricsOption;
    backButtonEvent?: MetricsOption;
    iconButtonEvent?: MetricsOption;
  },
) {
  const {
    hasBackButton = true,
    hasCancelButton = true,
    hasIconButton = false,
    handleIconPress,
  } = navBarOptions ?? {};

  const innerStyles = StyleSheet.create({
    headerStyle: {
      backgroundColor:
        navBarOptions?.backgroundColor ?? themeColors.background.default,
      shadowOffset: undefined,
    },
    headerLeft: {
      marginHorizontal: 16,
    },
    headerButtonText: {
      color: themeColors.primary.default,
      fontSize: 14,
      ...fontStyles.normal,
    },
    headerTitle: {
      alignItems: 'center',
    },
  });

  function navigationPop() {
    asNavigation(navigation).goBack();
  }

  function handleBackPress() {
    if (metricsOptions?.backButtonEvent) {
      withMetaMetrics(navigationPop, {
        event: metricsOptions.backButtonEvent.event,
        properties: metricsOptions.backButtonEvent.properties,
      })();
    } else {
      navigationPop();
    }
  }

  function handleCancelPress() {
    if (metricsOptions?.cancelButtonEvent) {
      withMetaMetrics(navigationPop, {
        event: metricsOptions.cancelButtonEvent.event,
        properties: metricsOptions.cancelButtonEvent.properties,
      })();
    } else {
      navigationPop();
    }
  }

  function handleIconPressWrapper() {
    if (!handleIconPress) return;
    if (metricsOptions?.iconButtonEvent) {
      withMetaMetrics(handleIconPress, {
        event: metricsOptions.iconButtonEvent.event,
        properties: metricsOptions.iconButtonEvent.properties,
      })();
    } else {
      handleIconPress();
    }
  }

  return {
    headerTitle: () => (
      <View style={innerStyles.headerTitle}>
        <MorphText variant={TextVariant.HeadingMD}>{title}</MorphText>
      </View>
    ),
    headerStyle: innerStyles.headerStyle,
    headerLeft: () =>
      hasBackButton ? (
        <ButtonIcon
          size={ButtonIconSizes.Lg}
          iconName={IconName.ArrowLeft}
          onPress={handleBackPress}
          style={innerStyles.headerLeft}
        />
      ) : (
        <></>
      ),
    headerRight: () =>
      hasCancelButton ? (
        <TouchableOpacity
          onPress={handleCancelPress}
          style={styles.closeButton}
        >
          <Text style={innerStyles.headerButtonText}>
            {strings('navigation.cancel')}
          </Text>
        </TouchableOpacity>
      ) : hasIconButton ? (
        <TouchableOpacity
          onPress={handleIconPressWrapper}
          style={styles.iconButton}
        >
          <Icon name={IconName.Question} />
        </TouchableOpacity>
      ) : (
        <></>
      ),
  };
}
