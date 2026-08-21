import React, { PureComponent } from 'react';
import { View } from 'react-native';
import { WebView } from '@metamask/react-native-webview';
import { Theme } from '@metamask/design-tokens';
import { getWebviewNavbar } from '../../UI/Navbar';
import Share from 'react-native-share'; // eslint-disable-line  import/default
import Logger from '../../../util/Logger';
import { baseStyles } from '../../../styles/common';
import { ThemeContext, mockTheme } from '../../../util/theme';

interface SimpleWebviewRouteParams {
  url?: string;
  title?: string;
  dispatch?: () => void;
}

interface SimpleWebviewNavigation {
  setOptions: (options: ReturnType<typeof getWebviewNavbar>) => void;
  setParams: (params: SimpleWebviewRouteParams) => void;
  /**
   * Used by the navbar back button. Not provided by every caller, e.g. tests
   * render the screen with a minimal navigation double.
   */
  pop?: () => void;
}

interface SimpleWebviewRoute {
  params?: SimpleWebviewRouteParams;
}

interface SimpleWebviewProps {
  /**
   * react-navigation object used to switch between screens
   */
  navigation: SimpleWebviewNavigation;
  /**
   * Object that represents the current route info like params passed to it
   */
  route: SimpleWebviewRoute;
}

export default class SimpleWebview extends PureComponent<SimpleWebviewProps> {
  updateNavBar = () => {
    const { navigation, route } = this.props;
    const colors =
      (this.context as unknown as Theme)?.colors || mockTheme.colors;
    navigation.setOptions(getWebviewNavbar(navigation, route, colors));
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
    if (uri) {
      return (
        <View style={baseStyles.flexGrow}>
          <WebView source={{ uri }} />
        </View>
      );
    }
    return null;
  }
}

export { default as createWebviewNavDetails } from './SimpleWebview.types';

SimpleWebview.contextType = ThemeContext;
