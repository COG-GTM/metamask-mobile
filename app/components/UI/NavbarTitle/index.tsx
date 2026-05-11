import React, { PureComponent, ReactNode } from 'react';
import { connect } from 'react-redux';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Networks, { getDecimalChainId } from '../../../util/networks';
import { strings } from '../../../../locales/i18n';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { Theme } from '@metamask/design-tokens';
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

interface ProviderConfig {
  type?: string;
  nickname?: string;
  chainId?: string;
}

interface OwnProps {
  title?: string;
  translate?: boolean;
  disableNetwork?: boolean;
  showSelectedNetwork?: boolean;
  networkName?: string;
  children?: ReactNode;
}

interface NavigationProps {
  navigation: NavigationProp<ParamListBase>;
}

interface StateProps {
  providerConfig: ProviderConfig;
  chainId: string;
  selectedNetworkName: string;
}

type NavbarTitleProps = OwnProps &
  NavigationProps &
  IWithMetricsAwarenessProps &
  StateProps;

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
    let name: string | null = null;

    const colors =
      (this.context as unknown as Theme)?.colors || mockTheme.colors;
    void colors;
    const styles = createStyles();

    if (selectedNetworkName || networkName) {
      name = networkName || selectedNetworkName;
    } else if (providerConfig.nickname) {
      name = providerConfig.nickname;
    } else {
      const networksMap = Networks as Record<
        string,
        { name?: string; color?: string | null } | undefined
      >;
      const networkType = providerConfig.type;
      name =
        (networkType && networksMap[networkType]?.name) ||
        networksMap.rpc?.name ||
        null;
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

NavbarTitle.contextType = ThemeContext;

const mapStateToProps = (state: RootState): StateProps => ({
  providerConfig: selectProviderConfig(state) as ProviderConfig,
  chainId: selectChainId(state) as string,
  selectedNetworkName: selectNetworkName(state) as string,
});

const ConnectedNavbarTitle = connect(mapStateToProps)(
  withMetricsAwareness(
    NavbarTitle as unknown as React.ComponentType<IWithMetricsAwarenessProps>,
  ),
) as unknown as React.ComponentType<{
  navigation: NavigationProp<ParamListBase>;
}>;

export default withNavigation(
  ConnectedNavbarTitle as unknown as Parameters<typeof withNavigation>[0],
);
