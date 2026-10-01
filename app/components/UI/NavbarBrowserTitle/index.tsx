import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme } from '@metamask/design-tokens';
import { fontStyles } from '../../../styles/common';
import Networks from '../../../util/networks';
import Icon from 'react-native-vector-icons/FontAwesome';
import Device from '../../../util/device';
import { mockTheme, ThemeContext } from '../../../util/theme';
import { selectProviderConfig } from '../../../selectors/networkController';
import { CommonSelectorsIDs } from '../../../../e2e/selectors/Common.selectors';
import { RootState } from '../../../reducers';

type ProviderConfig = ReturnType<typeof selectProviderConfig>;

interface NetworkInfo {
  name?: string;
  color?: string | null;
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

/**
 * UI PureComponent that renders inside the navbar
 * showing the view title and the selected network
 */
interface NavbarBrowserTitleProps {
  /**
   * Object representing the configuration for the selected network
   */
  providerConfig: ProviderConfig;
  /**
   * hostname of the current webview
   */
  hostname: string;
  /**
   * Boolean that specifies if it is a secure website
   */
  https?: boolean;
  /**
   * Boolean that specifies if there is an error
   */
  error?: boolean;
  /**
   * Website icon
   */
  icon?: string;
  /**
   * Object that represents the current route info like params passed to it
   */
  route?: {
    params?: {
      showUrlModal?: () => void;
    };
  };
}

class NavbarBrowserTitle extends PureComponent<NavbarBrowserTitleProps> {
  onTitlePress = () => {
    this.props.route?.params?.showUrlModal?.();
  };

  getNetworkName(providerConfig: ProviderConfig) {
    const networkList = Networks as Record<string, NetworkInfo>;
    let name = { ...networkList.rpc, color: null }.name;

    if (providerConfig) {
      if (providerConfig.nickname) {
        name = providerConfig.nickname;
      } else if (providerConfig.type) {
        const currentNetwork = networkList[providerConfig.type];
        if (currentNetwork?.name) {
          name = currentNetwork.name;
        }
      }
    }

    return name;
  }

  render = () => {
    const { https, providerConfig, hostname, error, icon } = this.props;
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
    const styles = createStyles(colors);
    const networkList = Networks as Record<string, NetworkInfo>;
    const color = networkList[providerConfig.type]?.color || null;
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
