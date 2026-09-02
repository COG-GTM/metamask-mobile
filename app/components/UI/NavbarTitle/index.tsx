import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { Theme } from '../../../util/theme/models';
import Networks, { getDecimalChainId } from '../../../util/networks';
import { strings } from '../../../../locales/i18n';
import { ThemeContext, mockTheme } from '../../../util/theme';
import Routes from '../../../constants/navigation/Routes';
import { MetaMetricsEvents } from '../../../core/Analytics';
import { withNavigation } from '@react-navigation/compat';
import {
  ProviderConfig,
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

interface NetworkListEntry {
  name: string;
  color?: string | null;
}

const TypedNetworks = Networks as unknown as Record<string, NetworkListEntry>;

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
 * UI PureComponent that renders inside the navbar
 * showing the view title and the selected network
 */
interface NavbarTitleProps extends IWithMetricsAwarenessProps {
  /**
   * Object representing the configuration of the current selected network
   */
  providerConfig: ProviderConfig;
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
  children?: React.ReactNode;
  /**
   * Selected multichain chainId
   */
  chainId?: string;
  /**
   * Selected network name
   */
  selectedNetworkName?: string;
}

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
      name =
        TypedNetworks[providerConfig.type]?.name ||
        { ...Networks.rpc, color: null }.name;
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

type NavbarTitleExternalProps = Omit<
  NavbarTitleProps,
  | 'metrics'
  | 'providerConfig'
  | 'chainId'
  | 'selectedNetworkName'
  | 'navigation'
> & { navigation?: NavigationProp<ParamListBase> };

export default withNavigation(
  connect(mapStateToProps)(
    withMetricsAwareness(NavbarTitle),
  ) as unknown as Parameters<typeof withNavigation>[0],
) as unknown as React.ComponentType<NavbarTitleExternalProps>;
