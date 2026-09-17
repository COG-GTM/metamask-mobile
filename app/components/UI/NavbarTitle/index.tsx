import React, { ComponentType, PureComponent, ReactNode } from 'react';
import { connect } from 'react-redux';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Theme } from '@metamask/design-tokens';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import Networks, { getDecimalChainId } from '../../../util/networks';
import { strings } from '../../../../locales/i18n';
import { ThemeContext, mockTheme } from '../../../util/theme';
import Routes from '../../../constants/navigation/Routes';
import { MetaMetricsEvents } from '../../../core/Analytics';
import { withNavigation, CompatNavigationProp } from '@react-navigation/compat';
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

const createStyles = (_colors: Theme['colors']) =>
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
 * Props supplied by consumers; the rest are injected by the HOCs below.
 */
export interface NavbarTitleOwnProps {
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

interface NavbarTitleProps
  extends NavbarTitleOwnProps,
    IWithMetricsAwarenessProps {
  /**
   * Object representing the configuration of the current selected network
   */
  providerConfig: ProviderConfig;
  /**
   * Object that represents the navigator
   */
  navigation: NavigationProp<ParamListBase>;
  /**
   * Selected multichain chainId
   */
  chainId?: string;
  /**
   * Selected network name
   */
  selectedNetworkName?: string;
}

/**
 * UI PureComponent that renders inside the navbar
 * showing the view title and the selected network
 */
class NavbarTitle extends PureComponent<NavbarTitleProps> {
  static defaultProps = {
    translate: true,
    showSelectedNetwork: true,
  };

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
      translate,
      showSelectedNetwork,
      children,
      networkName,
      selectedNetworkName,
    } = this.props;
    let name = null;

    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors);

    if (selectedNetworkName || networkName) {
      name = networkName || selectedNetworkName;
      // TODO: [SOLANA] Revisit this before shipping, some screens do not pass a network name as a prop, consider using the selector instead
    } else if (providerConfig.nickname) {
      name = providerConfig.nickname;
    } else {
      const networkType = providerConfig.type as keyof typeof Networks;
      name =
        Networks[networkType]?.name || { ...Networks.rpc, color: null }.name;
    }

    const realTitle = translate ? strings(title as string) : title;
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

NavbarTitle.contextType = ThemeContext;

const mapStateToProps = (state: RootState) => ({
  providerConfig: selectProviderConfig(state),
  chainId: selectChainId(state),
  selectedNetworkName: selectNetworkName(state),
});

// The HOC chain is untyped at its seams: `withMetricsAwareness` only accepts a
// `ComponentType<IWithMetricsAwarenessProps>` and `withNavigation` only a
// `ComponentType<{ navigation }>`, neither of which can express the props the
// other HOCs inject. The final assertion restores the consumer-facing props.
export default withNavigation(
  connect(mapStateToProps)(
    withMetricsAwareness(
      NavbarTitle as unknown as ComponentType<IWithMetricsAwarenessProps>,
    ),
  ) as unknown as ComponentType<{
    navigation: CompatNavigationProp<NavigationProp<ParamListBase>>;
  }>,
) as unknown as ComponentType<NavbarTitleOwnProps>;
