import React, { PureComponent } from 'react';
import { View } from 'react-native';
import { WebView } from '@metamask/react-native-webview';
import { getWebviewNavbar } from '../../UI/Navbar';
import Share from 'react-native-share'; // eslint-disable-line  import/default
import Logger from '../../../util/Logger';
import { baseStyles } from '../../../styles/common';
import { ThemeContext, mockTheme } from '../../../util/theme';

interface SimpleWebviewProps {
  /**
   * react-navigation object used to switch between screens
   */
  navigation: {
    setOptions: (options: Record<string, unknown>) => void;
    setParams: (params: Record<string, unknown>) => void;
  };
  /**
   * Object that represents the current route info like params passed to it
   */
  route: {
    params?: {
      url?: string;
      title?: string;
      dispatch?: () => void;
    };
  };
}

export default class SimpleWebview extends PureComponent<SimpleWebviewProps> {
  declare context: React.ContextType<typeof ThemeContext>;

  updateNavBar = () => {
    const { navigation, route } = this.props;
    const colors = this.context.colors || mockTheme.colors;
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
      }).catch((err: unknown) => {
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
  }
}

export { default as createWebviewNavDetails } from './SimpleWebview.types';

SimpleWebview.contextType = ThemeContext;
