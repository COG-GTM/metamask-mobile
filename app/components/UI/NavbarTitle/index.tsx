import React, { useRef, ComponentType, ReactNode } from 'react';
import { connect } from 'react-redux';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Networks, { getDecimalChainId } from '../../../util/networks';
import { strings } from '../../../../locales/i18n';
import Routes from '../../../constants/navigation/Routes';
import { MetaMetricsEvents } from '../../../core/Analytics';
import {
  withNavigation,
  CompatNavigationProp,
} from '@react-navigation/compat';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import {
  selectChainId,
  selectProviderConfig,
  ProviderConfig,
} from '../../../selectors/networkController';
import { withMetricsAwareness } from '../../../components/hooks/useMetrics';
import { IWithMetricsAwarenessProps } from '../../../components/hooks/useMetrics/withMetricsAwareness.types';
import Text, {
  TextVariant,
  TextColor,
} from '../../../component-library/components/Texts/Text';
import { selectNetworkName } from '../../../selectors/networkInfos';
import { RootState } from '../../../reducers';

const createStyles = () =>
  StyleSheet.create({
    wrapper: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    network: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });

interface OwnProps {
  /**
   * Name of the current view
   */
  title?: string;
  /**
   * Boolean that specifies if the title needs translation
   */
  translate?: boolean;
  /**
   * Boolean that specifies if the network can be changed
   */
  disableNetwork?: boolean;
  /**
   * Object that represents the navigator
   */
  navigation?: NavigationProp<ParamListBase>;
  /**
   * Boolean that specifies if the network selected is displayed
   */
  showSelectedNetwork?: boolean;
  /**
   * Name of the network to display
   */
  networkName?: string;
  /**
   * Content to display inside text element
   */
  children?: ReactNode;
}

interface StateProps {
  /**
   * Object representing the configuration of the current selected network
   */
  providerConfig: ProviderConfig;
  /**
   * Selected multichain chainId
   */
  chainId?: string;
  /**
   * Selected network name
   */
  selectedNetworkName?: string;
}

type Props = OwnProps & StateProps & IWithMetricsAwarenessProps;

/**
 * UI component that renders inside the navbar
 * showing the view title and the selected network
 */
const NavbarTitle = ({
  providerConfig,
  title,
  translate = true,
  disableNetwork,
  navigation,
  metrics,
  showSelectedNetwork = true,
  networkName,
  children,
  chainId,
  selectedNetworkName,
}: Props) => {
  const animating = useRef(false);
  const styles = createStyles();

  const openNetworkList = () => {
    if (!disableNetwork) {
      if (!animating.current) {
        animating.current = true;
        navigation?.navigate(Routes.MODAL.ROOT_MODAL_FLOW, {
          screen: Routes.SHEET.NETWORK_SELECTOR,
        });

        metrics.trackEvent(
          metrics
            .createEventBuilder(MetaMetricsEvents.NETWORK_SELECTOR_PRESSED)
            .addProperties({
              chain_id: getDecimalChainId(chainId),
            })
            .build(),
        );
        setTimeout(() => {
          animating.current = false;
        }, 500);
      }
    }
  };

  let name = null;

  if (selectedNetworkName || networkName) {
    name = networkName || selectedNetworkName;
    // TODO: [SOLANA] Revisit this before shipping, some screens do not pass a network name as a prop, consider using the selector instead
  } else if (providerConfig.nickname) {
    name = providerConfig.nickname;
  } else {
    const network = Networks[providerConfig.type as keyof typeof Networks];
    name = network?.name || { ...Networks.rpc, color: null }.name;
  }

  const realTitle = translate ? strings(title) : title;
  return (
    <TouchableOpacity
      onPress={openNetworkList}
      style={styles.wrapper}
      activeOpacity={disableNetwork ? 1 : 0.2}
    >
      {title ? (
        <Text numberOfLines={1} variant={TextVariant.BodyMDBold}>
          {realTitle}
        </Text>
      ) : null}
      {typeof children === 'string' ? (
        <Text variant={TextVariant.BodyMDBold}>{strings(children)}</Text>
      ) : (
        children
      )}
      {showSelectedNetwork ? (
        <View style={styles.network}>
          <Text
            numberOfLines={1}
            variant={TextVariant.BodySM}
            color={TextColor.Alternative}
          >
            {name}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  providerConfig: selectProviderConfig(state),
  chainId: selectChainId(state),
  selectedNetworkName: selectNetworkName(state),
});

interface NavigationInjectedProps {
  navigation: CompatNavigationProp<NavigationProp<ParamListBase>>;
}

const ConnectedNavbarTitle = connect(mapStateToProps)(
  withMetricsAwareness(
    NavbarTitle as ComponentType<IWithMetricsAwarenessProps>,
  ) as ComponentType<OwnProps & StateProps>,
);

export default withNavigation(
  ConnectedNavbarTitle as unknown as ComponentType<NavigationInjectedProps>,
) as unknown as ComponentType<OwnProps>;
