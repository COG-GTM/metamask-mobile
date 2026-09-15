import React, { ComponentType, PureComponent, ReactNode } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Networks, { getDecimalChainId } from '../../../util/networks';
import { strings } from '../../../../locales/i18n';
import { ThemeContext } from '../../../util/theme';
import Routes from '../../../constants/navigation/Routes';
import { MetaMetricsEvents } from '../../../core/Analytics';
import { withNavigation } from '@react-navigation/compat';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import {
  selectChainId,
  selectProviderConfig,
} from '../../../selectors/networkController';
import { withMetricsAwareness } from '../../../components/hooks/useMetrics';
import { IWithMetricsAwarenessProps } from '../../../components/hooks/useMetrics/withMetricsAwareness.types';
import { RootState } from '../../../reducers';
import Text, {
  TextVariant,
  TextColor,
} from '../../../component-library/components/Texts/Text';
import { selectNetworkName } from '../../../selectors/networkInfos';

interface NetworkInfo {
  name: string;
}

const getNetworkInfo = (type: string): NetworkInfo | undefined =>
  (Networks as Record<string, NetworkInfo | undefined>)[type];

interface NavbarTitleOwnProps {
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
  navigation: NavigationProp<ParamListBase>;
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

type NavbarTitleProps = NavbarTitleOwnProps &
  IWithMetricsAwarenessProps &
  ConnectedProps<typeof connector>;

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

/**
 * UI PureComponent that renders inside the navbar
 * showing the view title and the selected network
 */
class NavbarTitle extends PureComponent<NavbarTitleProps> {
  static contextType = ThemeContext;

  animating = false;

  openNetworkList = () => {
    if (!this.props.disableNetwork) {
      if (!this.animating) {
        this.animating = true;
        this.props.navigation.navigate(Routes.MODAL.ROOT_MODAL_FLOW, {
          screen: Routes.SHEET.NETWORK_SELECTOR,
        });

        this.props.metrics.trackEvent(
          this.props.metrics
            .createEventBuilder(MetaMetricsEvents.NETWORK_SELECTOR_PRESSED)
            .addProperties({
              chain_id: getDecimalChainId(this.props.chainId),
            })
            .build(),
        );
        setTimeout(() => {
          this.animating = false;
        }, 500);
      }
    }
  };

  render = () => {
    const {
      providerConfig,
      title,
      translate = true,
      showSelectedNetwork = true,
      children,
      networkName,
      selectedNetworkName,
    } = this.props;
    let name: string | null | undefined = null;

    const styles = createStyles();

    if (selectedNetworkName || networkName) {
      name = networkName || selectedNetworkName;
      // TODO: [SOLANA] Revisit this before shipping, some screens do not pass a network name as a prop, consider using the selector instead
    } else if (providerConfig.nickname) {
      name = providerConfig.nickname;
    } else {
      name =
        getNetworkInfo(providerConfig.type)?.name ||
        { ...Networks.rpc, color: null }.name;
    }

    const realTitle = translate && title ? strings(title) : title;
    return (
      <TouchableOpacity
        onPress={this.openNetworkList}
        style={styles.wrapper}
        activeOpacity={this.props.disableNetwork ? 1 : 0.2}
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
}

const mapStateToProps = (state: RootState) => ({
  providerConfig: selectProviderConfig(state),
  chainId: selectChainId(state),
  selectedNetworkName: selectNetworkName(state),
});

const connector = connect(mapStateToProps);

const NavbarTitleWithMetrics: ComponentType<
  Omit<NavbarTitleProps, keyof IWithMetricsAwarenessProps>
> = withMetricsAwareness(
  NavbarTitle as unknown as ComponentType<IWithMetricsAwarenessProps>,
);

// The compat typings of `withNavigation` collapse the wrapped props to `never`.
const withNavigationInjected = withNavigation as unknown as <
  P extends Pick<NavbarTitleOwnProps, 'navigation'>,
>(
  Comp: ComponentType<P>,
) => ComponentType<Omit<P, 'navigation'>>;

export default withNavigationInjected(connector(NavbarTitleWithMetrics));
