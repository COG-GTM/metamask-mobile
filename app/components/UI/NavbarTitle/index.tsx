import React, { PureComponent, ReactNode } from 'react';
import { connect } from 'react-redux';
import { TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import Networks, { getDecimalChainId } from '../../../util/networks';
import { strings } from '../../../../locales/i18n';
import { ThemeContext, mockTheme } from '../../../util/theme';
import Routes from '../../../constants/navigation/Routes';
import { MetaMetricsEvents } from '../../../core/Analytics';
import { withNavigation } from '@react-navigation/compat';
import {
  selectChainId,
  selectProviderConfig,
} from '../../../selectors/networkController';
import { withMetricsAwareness } from '../../../components/hooks/useMetrics';
import Text, {
  TextVariant,
  TextColor,
} from '../../../component-library/components/Texts/Text';
import { selectNetworkName } from '../../../selectors/networkInfos';
import { RootState } from '../../../reducers';
import { Theme } from '../../../util/theme/models';

interface Styles {
  wrapper: ViewStyle;
  network: ViewStyle;
}

const createStyles = (colors: Theme['colors']): Styles =>
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
}

interface MetricsObject {
  trackEvent: (event: Record<string, unknown>) => void;
  createEventBuilder: (event: string) => {
    addProperties: (props: Record<string, unknown>) => {
      build: () => Record<string, unknown>;
    };
  };
}

interface NavigationObject {
  navigate: (route: string, params?: Record<string, unknown>) => void;
}

interface NavbarTitleProps {
  providerConfig: ProviderConfig;
  title?: string;
  translate?: boolean;
  disableNetwork?: boolean;
  navigation?: NavigationObject;
  metrics?: MetricsObject;
  showSelectedNetwork?: boolean;
  networkName?: string;
  children?: ReactNode;
  chainId?: string;
  selectedNetworkName?: string;
}

class NavbarTitle extends PureComponent<NavbarTitleProps> {
  static defaultProps = {
    translate: true,
    showSelectedNetwork: true,
  };

  declare context: React.ContextType<typeof ThemeContext>;

  animating = false;

  openNetworkList = () => {
    if (!this.props.disableNetwork) {
      if (!this.animating) {
        this.animating = true;
        this.props.navigation?.navigate(Routes.MODAL.ROOT_MODAL_FLOW, {
          screen: Routes.SHEET.NETWORK_SELECTOR,
        });

        this.props.metrics?.trackEvent(
          this.props.metrics
            .createEventBuilder(MetaMetricsEvents.NETWORK_SELECTOR_PRESSED)
            .addProperties({
              chain_id: getDecimalChainId(this.props.chainId ?? ''),
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

    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    if (selectedNetworkName || networkName) {
      name = networkName || selectedNetworkName || null;
    } else if (providerConfig.nickname) {
      name = providerConfig.nickname;
    } else {
      const networkType = providerConfig.type as keyof typeof Networks;
      name =
        (Networks[networkType] && Networks[networkType].name) ||
        { ...Networks.rpc, color: null }.name;
    }

    const realTitle = translate ? strings(title ?? '') : title;
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

export default withNavigation(
  connect(mapStateToProps)(withMetricsAwareness(NavbarTitle)),
);
