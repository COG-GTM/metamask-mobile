import React, { PureComponent, ReactNode } from 'react';
import { connect } from 'react-redux';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import type { CompatNavigationProp } from '@react-navigation/compat/lib/typescript/src/types';
import Networks, { getDecimalChainId } from '../../../util/networks';
import { strings } from '../../../../locales/i18n';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { Colors } from '../../../util/theme/models';
import Routes from '../../../constants/navigation/Routes';
import { MetaMetricsEvents } from '../../../core/Analytics';
import { withNavigation } from '@react-navigation/compat';
import {
  selectChainId,
  selectProviderConfig,
  ProviderConfig,
} from '../../../selectors/networkController';
import { withMetricsAwareness } from '../../../components/hooks/useMetrics';
import { IUseMetricsHook } from '../../../components/hooks/useMetrics/useMetrics.types';
import Text, {
  TextVariant,
  TextColor,
} from '../../../component-library/components/Texts/Text';
import { selectNetworkName } from '../../../selectors/networkInfos';
import { RootState } from '../../../reducers';

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

interface OwnProps {
  title?: string;
  translate?: boolean;
  disableNetwork?: boolean;
  navigation?: NavigationProp<Record<string, object | undefined>>;
  metrics?: IUseMetricsHook;
  showSelectedNetwork?: boolean;
  networkName?: string;
  children?: ReactNode;
}

interface StateProps {
  providerConfig?: ProviderConfig;
  chainId: string;
  selectedNetworkName?: string;
}

type NavbarTitleProps = OwnProps & StateProps;

interface NetworkEntry {
  name?: string;
  color?: string | null;
}

/**
 * UI PureComponent that renders inside the navbar
 * showing the view title and the selected network
 */
class NavbarTitle extends PureComponent<NavbarTitleProps> {
  static contextType = ThemeContext;
  declare context: React.ContextType<typeof ThemeContext>;

  static defaultProps = {
    translate: true,
    showSelectedNetwork: true,
  };

  animating = false;

  openNetworkList = (): void => {
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

    const colors: Colors = this.context?.colors || mockTheme.colors;
    const styles = createStyles(colors);

    if (selectedNetworkName || networkName) {
      name = networkName || selectedNetworkName || null;
    } else if (providerConfig?.nickname) {
      name = providerConfig.nickname;
    } else {
      const networksByType = Networks as Record<string, NetworkEntry>;
      const providerType =
        (providerConfig as { type?: string } | undefined)?.type ?? '';
      name =
        (networksByType[providerType] && networksByType[providerType].name) ||
        ({ ...networksByType.rpc, color: null }.name ?? null);
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

const mapStateToProps = (state: RootState): StateProps => ({
  providerConfig: selectProviderConfig(state),
  chainId: selectChainId(state),
  selectedNetworkName: selectNetworkName(state),
});

// HOCs in this codebase use loose typing; cast through ComponentType<unknown>
// so the connect/withMetricsAwareness/withNavigation chain composes correctly.
const NavbarTitleWithMetrics = withMetricsAwareness(
  NavbarTitle as unknown as React.ComponentType<{ metrics: IUseMetricsHook }>,
);
const ConnectedNavbarTitle = connect(mapStateToProps)(
  NavbarTitleWithMetrics as unknown as React.ComponentType<
    Record<string, unknown>
  >,
);
const NavbarTitleForNavigation = ConnectedNavbarTitle as unknown as React.ComponentType<{
  navigation: CompatNavigationProp<NavigationProp<ParamListBase>>;
}>;
export default withNavigation(
  NavbarTitleForNavigation,
) as unknown as React.ComponentType<OwnProps>;
