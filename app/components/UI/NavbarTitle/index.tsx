/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/prefer-optional-chain */
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
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

const createStyles = (colors: any): any =>
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
interface NavbarTitleProps {
  chainId?: string;
  children?: React.ReactNode;
  disableNetwork?: boolean;
  metrics?: Record<string, any>;
  navigation?: Record<string, any>;
  networkName?: string;
  providerConfig: Record<string, any>;
  selectedNetworkName?: string;
  showSelectedNetwork?: boolean;
  title?: string;
  translate?: boolean;
}
type Props = NavbarTitleProps;

class NavbarTitle extends PureComponent<Props> {
  static defaultProps = {
    translate: true,
    showSelectedNetwork: true,
  };

  animating = false;

  openNetworkList = () => {
    if (!this.props.disableNetwork) {
      if (!this.animating) {
        this.animating = true;
        // @ts-expect-error -- legacy JavaScript UI type boundary
        this.props.navigation.navigate(Routes.MODAL.ROOT_MODAL_FLOW, {
          screen: Routes.SHEET.NETWORK_SELECTOR,
        });

        // @ts-expect-error -- legacy JavaScript UI type boundary
        this.props.metrics.trackEvent(
          // @ts-expect-error -- legacy JavaScript UI type boundary
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

    const colors = (this as any).context.colors || mockTheme.colors;
    const styles: any = createStyles(colors);

    if (selectedNetworkName || networkName) {
      name = networkName || selectedNetworkName;
      // TODO: [SOLANA] Revisit this before shipping, some screens do not pass a network name as a prop, consider using the selector instead
    } else if (providerConfig.nickname) {
      name = providerConfig.nickname;
    } else {
      name =
        ((Networks as any)[providerConfig.type] && (Networks as any)[providerConfig.type].name) ||
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

const mapStateToProps = (state: any) => ({
  providerConfig: selectProviderConfig(state),
  chainId: selectChainId(state),
  selectedNetworkName: selectNetworkName(state),
});

const ConnectedNavbarTitle = connect(mapStateToProps)(
  withMetricsAwareness(NavbarTitle as any) as any,
) as any;

export default withNavigation(ConnectedNavbarTitle as any) as any;
