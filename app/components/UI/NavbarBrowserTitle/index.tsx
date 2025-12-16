import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fontStyles } from '../../../styles/common';
import Networks from '../../../util/networks';
import Icon from 'react-native-vector-icons/FontAwesome';
import Device from '../../../util/device';
import { mockTheme, ThemeContext } from '../../../util/theme';
import { selectProviderConfig } from '../../../selectors/networkController';
import { CommonSelectorsIDs } from '../../../../e2e/selectors/Common.selectors';
import { RootState } from '../../../reducers';
import { Theme } from '../../../util/theme/models';
import { RouteProp } from '@react-navigation/native';

interface NetworkInfo {
  name?: string;
  color?: string;
}

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    wrapper: {
      alignItems: 'center',
      flex: 1,
    },
    network: {
      flexDirection: 'row',
      marginBottom: 5,
    },
    networkName: {
      fontSize: 11,
      lineHeight: 11,
      color: colors.text.default,
      ...fontStyles.normal,
    },
    networkIcon: {
      marginTop: 3,
      width: 5,
      height: 5,
      borderRadius: 100,
      marginRight: 5,
    },
    currentUrlWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      marginBottom: Device.isAndroid() ? 5 : 0,
    },
    lockIcon: {
      marginTop: 2,
      marginLeft: 10,
      color: colors.text.default,
    },
    currentUrl: {
      ...fontStyles.normal,
      fontSize: 14,
      textAlign: 'center',
      color: colors.text.default,
    },
    currentUrlAndroid: {
      maxWidth: '60%',
    },
    siteIcon: {
      width: 16,
      height: 16,
      marginRight: 4,
    },
  });

interface ProviderConfig {
  type?: string;
  nickname?: string;
}

interface RouteParams {
  showUrlModal?: () => void;
}

interface NavbarBrowserTitleProps {
  providerConfig: ProviderConfig;
  hostname: string;
  https?: boolean;
  error?: boolean;
  icon?: string;
  route?: RouteProp<{ params: RouteParams }, 'params'>;
}

class NavbarBrowserTitle extends PureComponent<NavbarBrowserTitleProps> {
  declare context: Theme;

  onTitlePress = () => {
    this.props.route?.params?.showUrlModal?.();
  };

  getNetworkName(providerConfig: ProviderConfig): string {
    let name = { ...(Networks as Record<string, NetworkInfo>).rpc, color: null }.name || '';

    if (providerConfig) {
      if (providerConfig.nickname) {
        name = providerConfig.nickname;
      } else if (providerConfig.type) {
        const currentNetwork = (Networks as Record<string, NetworkInfo>)[providerConfig.type];
        if (currentNetwork && currentNetwork.name) {
          name = currentNetwork.name;
        }
      }
    }

    return name;
  }

  render = () => {
    const { https, providerConfig, hostname, error, icon } = this.props;
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);
    const color =
      ((Networks as Record<string, NetworkInfo>)[providerConfig.type || ''] && (Networks as Record<string, NetworkInfo>)[providerConfig.type || ''].color) ||
      null;
    const name = this.getNetworkName(providerConfig);

    return (
      <TouchableOpacity onPress={this.onTitlePress} style={styles.wrapper}>
        <View style={styles.currentUrlWrapper}>
          {Boolean(icon) && (
            <Image style={styles.siteIcon} source={{ uri: icon }} />
          )}
          <Text
            numberOfLines={1}
            ellipsizeMode={'head'}
            style={[
              styles.currentUrl,
              Device.isAndroid() ? styles.currentUrlAndroid : {},
            ]}
          >
            {hostname}
          </Text>
          {https && !error ? (
            <Icon name="lock" size={14} style={styles.lockIcon} />
          ) : null}
        </View>
        <View style={styles.network}>
          <View
            style={[
              styles.networkIcon,
              { backgroundColor: color || colors.error.default },
            ]}
          />
          <Text
            numberOfLines={1}
            style={styles.networkName}
            testID={CommonSelectorsIDs.NAVBAR_TITLE_NETWORKS_TEXT}
          >
            {name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
}

const mapStateToProps = (state: RootState) => ({
  providerConfig: selectProviderConfig(state),
});

NavbarBrowserTitle.contextType = ThemeContext;

export default connect(mapStateToProps)(NavbarBrowserTitle);
