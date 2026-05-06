/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { PureComponent, ReactNode } from 'react';
import { connect, ConnectedProps } from 'react-redux';
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

const createStyles = (_colors: any) =>
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
  navigation?: any;
  metrics?: any;
  showSelectedNetwork?: boolean;
  networkName?: string;
  children?: ReactNode;
}

type Props = OwnProps & PropsFromRedux;

/**
 * UI PureComponent that renders inside the navbar
 * showing the view title and the selected network
 */
class NavbarTitle extends PureComponent<Props> {
  declare context: any;

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

    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

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

    const realTitle = translate ? strings(title as any) : title;
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

(NavbarTitle as any).contextType = ThemeContext;

const mapStateToProps = (state: any) => ({
  providerConfig: selectProviderConfig(state),
  chainId: selectChainId(state),
  selectedNetworkName: selectNetworkName(state),
});

const connector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default withNavigation(
  connector(withMetricsAwareness(NavbarTitle as any) as any) as any,
);
