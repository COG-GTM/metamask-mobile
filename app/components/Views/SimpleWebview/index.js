import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import { WebView } from '@metamask/react-native-webview';
import { getWebviewNavbar } from '../../UI/Navbar';
import Share from 'react-native-share'; // eslint-disable-line  import/default
import Logger from '../../../util/Logger';
import { baseStyles } from '../../../styles/common';
import { ThemeContext, mockTheme } from '../../../util/theme';
import {
  getSimpleWebviewHostname,
  isAllowedSimpleWebviewUrl,
  onSimpleWebviewShouldStartLoad,
} from './SimpleWebview.utils';

// Every origin passes the WebView whitelist so that its default handler never
// forwards non-web schemes to Linking.openURL; onShouldStartLoadWithRequest
// decides instead.
const ORIGIN_WHITELIST = ['*'];

export default class SimpleWebview extends PureComponent {
  static propTypes = {
    /**
     * react-navigation object used to switch between screens
     */
    navigation: PropTypes.object,
    /**
     * Object that represents the current route info like params passed to it
     */
    route: PropTypes.object,
  };

  updateNavBar = () => {
    const { navigation, route } = this.props;
    const colors = this.context.colors || mockTheme.colors;
    const title =
      route.params?.title || getSimpleWebviewHostname(route.params?.url);
    navigation.setOptions(
      getWebviewNavbar(
        navigation,
        { ...route, params: { ...route.params, title } },
        colors,
      ),
    );
  };

  componentDidMount = () => {
    const { navigation } = this.props;
    this.updateNavBar();
    navigation && navigation.setParams({ dispatch: this.share });
  };

  componentDidUpdate = () => {
    this.updateNavBar();
  };

  share = () => {
    const { route } = this.props;
    const url = route.params?.url;
    if (url) {
      Share.open({
        url,
      }).catch((err) => {
        Logger.log('Error while trying to share simple web view', err);
      });
    }
  };

  render() {
    const uri = this.props.route.params?.url;
    if (isAllowedSimpleWebviewUrl(uri)) {
      return (
        <View style={baseStyles.flexGrow}>
          <WebView
            source={{ uri }}
            originWhitelist={ORIGIN_WHITELIST}
            onShouldStartLoadWithRequest={onSimpleWebviewShouldStartLoad}
          />
        </View>
      );
    }
    return null;
  }
}

export { default as createWebviewNavDetails } from './SimpleWebview.types';

SimpleWebview.contextType = ThemeContext;
