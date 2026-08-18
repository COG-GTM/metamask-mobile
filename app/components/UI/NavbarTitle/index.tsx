import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Networks, { getDecimalChainId } from '../../../util/networks';
import { strings } from '../../../../locales/i18n';
import { ThemeContext, mockTheme } from '../../../util/theme';
import Routes from '../../../constants/navigation/Routes';
import { MetaMetricsEvents } from '../../../core/Analytics';
import { CompatNavigationProp, withNavigation } from '@react-navigation/compat';
import {
  type ProviderConfig,
  selectChainId,
  selectProviderConfig,
} from '../../../selectors/networkController';
import {
  IUseMetricsHook,
  withMetricsAwareness,
} from '../../../components/hooks/useMetrics';
import type { IWithMetricsAwarenessProps } from '../../../components/hooks/useMetrics/withMetricsAwareness.types';
import Text, {
  TextVariant,
  TextColor,
} from '../../../component-library/components/Texts/Text';
import { selectNetworkName } from '../../../selectors/networkInfos';
import type { Colors, Theme } from '../../../util/theme/models';
import type { RootState } from '../../../reducers';

const createStyles = (_colors: Colors) =>
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

interface StateProps {
  /**
   * Object representing the configuration of the current selected network
   */
  providerConfig: ProviderConfig;
  /**
   * Selected multichain chainId
   */
  chainId: string;
  /**
   * Selected network name
   */
  selectedNetworkName?: string;
}

interface OwnProps {
  /**
   * Name of the view, used as an i18n key when `translate` is set
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
  children?: React.ReactNode;
}

interface NavbarTitleProps extends OwnProps, StateProps {
  /**
   * Metrics injected by the withMetricsAwareness HOC
   */
  metrics: IUseMetricsHook;
}

/**
 * UI PureComponent that renders inside the navbar
 * showing the view title and the selected network
 */
class NavbarTitle extends PureComponent<NavbarTitleProps> {
  animating = false;

  openNetworkList = () => {
    if (!this.props.disableNetwork) {
      if (!this.animating) {
        this.animating = true;
        (
          this.props.navigation as NavigationProp<ParamListBase>
        ).navigate(Routes.MODAL.ROOT_MODAL_FLOW, {
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
    let name: string | undefined;

    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors);

    if (selectedNetworkName || networkName) {
      name = networkName || selectedNetworkName;
      // TODO: [SOLANA] Revisit this before shipping, some screens do not pass a network name as a prop, consider using the selector instead
    } else if (providerConfig.nickname) {
      name = providerConfig.nickname;
    } else {
      const providerType = providerConfig.type;
      name =
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        ((Networks as Record<string, { name?: string }>)[providerType] &&
          (Networks as Record<string, { name?: string }>)[providerType].name) ||
        { ...Networks.rpc, color: null }.name;
    }

    const realTitle = translate ? strings(title) : title;
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

const mapStateToProps = (state: RootState): StateProps => ({
  providerConfig: selectProviderConfig(state),
  chainId: selectChainId(state),
  selectedNetworkName: selectNetworkName(state),
});

// `withMetricsAwareness` and `withNavigation` are typed to only accept the props
// they inject, so the composition is re-typed with the props consumers pass.
const NavbarTitleWithMetrics = withMetricsAwareness(
  NavbarTitle as unknown as React.ComponentType<IWithMetricsAwarenessProps>,
);

const ConnectedNavbarTitle = connect(mapStateToProps)(
  NavbarTitleWithMetrics,
) as unknown as React.ComponentType<{
  navigation: CompatNavigationProp<NavigationProp<ParamListBase>>;
}>;

export default withNavigation(
  ConnectedNavbarTitle,
) as unknown as React.ComponentType<OwnProps>;
